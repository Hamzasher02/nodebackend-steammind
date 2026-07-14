import fs from 'fs';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import competitionModel from '../model/competition.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Safe cleanup function to remove local uploads
function safeCleanup(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
}

// Helper to parse JSON or array
function parseJsonOrArray(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) return parsed;
        } catch {}
        return input.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
}

// 1. Get All Competitions (with Searching, Filtering, Pagination, and KPI metrics)
const getAllCompetitions = asyncWrapper(async (req, res) => {
    const { status, competitionType, state, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
        query.status = status;
    }
    if (competitionType) {
        query.competitionType = competitionType;
    }
    if (state) {
        const now = new Date();
        if (state === 'upcoming') {
            query.startDate = { $gt: now };
        } else if (state === 'completed') {
            query.endDate = { $lt: now };
        } else if (state === 'ongoing') {
            query.$and = [
                { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
                { $or: [{ endDate: { $gte: now } }, { endDate: null }] }
            ];
        }
    }
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const competitions = await competitionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum);

    const totalCount = await competitionModel.countDocuments(query);

    // KPI Metrics calculation
    const totalCompetitions = await competitionModel.countDocuments();
    const publishedCompetitions = await competitionModel.countDocuments({ status: 'published' });
    const draftCompetitions = await competitionModel.countDocuments({ status: 'draft' });

    res.status(200).json({
        success: true,
        data: competitions,
        meta: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalResults: totalCount,
            kpis: {
                total: totalCompetitions,
                published: publishedCompetitions,
                draft: draftCompetitions
            }
        }
    });
});

// 2. Get Single Competition
const getSingleCompetition = asyncWrapper(async (req, res) => {
    const { competitionId } = req.params;

    let comp;
    if (competitionId.match(/^[0-9a-fA-F]{24}$/)) {
        comp = await competitionModel.findById(competitionId);
    } else {
        comp = await competitionModel.findOne({ urlSlug: competitionId.toLowerCase() });
    }

    if (!comp) {
        throw new NOT_FOUND('Competition not found');
    }

    res.status(200).json({
        success: true,
        data: comp
    });
});

// 3. Create Competition
const createCompetition = asyncWrapper(async (req, res) => {
    const {
        title,
        competitionType,
        urlSlug,
        hostedBy,
        shortDescription,
        startDate,
        endDate,
        teamSize,
        gradeRange,
        maximumParticipants,
        registrationStatus,
        registrationFee,
        allowSaveInfo,
        status,
        contentBlocks
    } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Thumbnail image is required');
    }

    // Check slug uniqueness
    const existing = await competitionModel.findOne({ urlSlug: urlSlug.toLowerCase() });
    if (existing) {
        safeCleanup(req);
        throw new BAD_REQUEST('URL Slug is already in use');
    }

    let cloudResult;
    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    let parsedTeamSize = { min: 1, max: 4 };
    if (teamSize) {
        parsedTeamSize = typeof teamSize === 'string' ? JSON.parse(teamSize) : teamSize;
    }

    const newComp = await competitionModel.create({
        title,
        competitionType: competitionType || 'official',
        urlSlug: urlSlug.toLowerCase(),
        hostedBy: hostedBy || 'STEAM MINDS',
        shortDescription: shortDescription || '',
        thumbnail: cloudResult,
        startDate: startDate || null,
        endDate: endDate || null,
        teamSize: parsedTeamSize,
        gradeRange: parseJsonOrArray(gradeRange),
        maximumParticipants: maximumParticipants || null,
        registrationStatus: registrationStatus || 'open',
        registrationFee: registrationFee || 'free',
        allowSaveInfo: allowSaveInfo === 'true' || allowSaveInfo === true,
        contentBlocks: contentBlocks ? (typeof contentBlocks === 'string' ? JSON.parse(contentBlocks) : contentBlocks) : [],
        status: status || 'draft'
    });

    safeCleanup(req);

    res.status(201).json({
        success: true,
        message: 'Competition created successfully',
        data: newComp
    });
});

// 4. Update Competition
const updateCompetition = asyncWrapper(async (req, res) => {
    const { competitionId } = req.params;
    const {
        title,
        competitionType,
        urlSlug,
        hostedBy,
        shortDescription,
        startDate,
        endDate,
        teamSize,
        gradeRange,
        maximumParticipants,
        registrationStatus,
        registrationFee,
        allowSaveInfo,
        status,
        contentBlocks
    } = req.body;

    const comp = await competitionModel.findById(competitionId);
    if (!comp) {
        safeCleanup(req);
        throw new NOT_FOUND('Competition not found');
    }

    if (urlSlug) {
        const existing = await competitionModel.findOne({ urlSlug: urlSlug.toLowerCase(), _id: { $ne: competitionId } });
        if (existing) {
            safeCleanup(req);
            throw new BAD_REQUEST('URL Slug is already in use by another competition');
        }
        comp.urlSlug = urlSlug.toLowerCase();
    }

    let newThumbnail = comp.thumbnail;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        await deleteFromCloud(comp.thumbnail.publicId);
        newThumbnail = cloudResult;
    }

    if (title !== undefined) comp.title = title;
    if (competitionType !== undefined) comp.competitionType = competitionType;
    if (hostedBy !== undefined) comp.hostedBy = hostedBy;
    if (shortDescription !== undefined) comp.shortDescription = shortDescription;
    if (startDate !== undefined) comp.startDate = startDate || null;
    if (endDate !== undefined) comp.endDate = endDate || null;
    if (teamSize !== undefined) {
        comp.teamSize = typeof teamSize === 'string' ? JSON.parse(teamSize) : teamSize;
    }
    if (gradeRange !== undefined) comp.gradeRange = parseJsonOrArray(gradeRange);
    if (maximumParticipants !== undefined) comp.maximumParticipants = maximumParticipants || null;
    if (registrationStatus !== undefined) comp.registrationStatus = registrationStatus;
    if (registrationFee !== undefined) comp.registrationFee = registrationFee;
    if (allowSaveInfo !== undefined) comp.allowSaveInfo = allowSaveInfo === 'true' || allowSaveInfo === true;
    if (status !== undefined) comp.status = status;
    if (contentBlocks !== undefined) {
        comp.contentBlocks = typeof contentBlocks === 'string' ? JSON.parse(contentBlocks) : contentBlocks;
    }
    comp.thumbnail = newThumbnail;

    await comp.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Competition updated successfully',
        data: comp
    });
});

// 5. Delete Competition
const deleteCompetition = asyncWrapper(async (req, res) => {
    const { competitionId } = req.params;

    const comp = await competitionModel.findById(competitionId);
    if (!comp) {
        throw new NOT_FOUND('Competition not found');
    }

    await deleteFromCloud(comp.thumbnail.publicId);
    await comp.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Competition deleted successfully'
    });
});

export {
    getAllCompetitions,
    getSingleCompetition,
    createCompetition,
    updateCompetition,
    deleteCompetition
};
