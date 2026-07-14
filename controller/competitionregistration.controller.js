import { NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import competitionRegistrationModel from '../model/competitionregistration.model.js';

// 1. Get All Registrations (with Searching, Filtering, Pagination, and KPI metrics)
const getRegistrations = asyncWrapper(async (req, res) => {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
        query.status = status;
    }
    if (search) {
        query.$or = [
            { studentName: { $regex: search, $options: 'i' } },
            { teamName: { $regex: search, $options: 'i' } }
        ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const registrations = await competitionRegistrationModel.find(query)
        .populate('competitionId', 'title')
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum);

    const totalCount = await competitionRegistrationModel.countDocuments(query);

    // KPI Metrics calculation
    const totalRegistrations = await competitionRegistrationModel.countDocuments();
    const confirmedRegistrations = await competitionRegistrationModel.countDocuments({ status: 'confirmed' });
    const pendingRegistrations = await competitionRegistrationModel.countDocuments({ status: 'pending' });
    const canceledRegistrations = await competitionRegistrationModel.countDocuments({ status: 'canceled' });

    res.status(200).json({
        success: true,
        data: registrations,
        meta: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalResults: totalCount,
            kpis: {
                total: totalRegistrations,
                confirmed: confirmedRegistrations,
                pending: pendingRegistrations,
                canceled: canceledRegistrations
            }
        }
    });
});

// 2. Create Registration
const createRegistration = asyncWrapper(async (req, res) => {
    const { competitionId, studentName, grade, teamName, teamSize } = req.body;

    const newReg = await competitionRegistrationModel.create({
        competitionId,
        studentName,
        grade,
        teamName,
        teamSize,
        status: 'pending'
    });

    res.status(201).json({
        success: true,
        message: 'Registration submitted successfully',
        data: newReg
    });
});

// 3. Update Registration Status
const updateRegistrationStatus = asyncWrapper(async (req, res) => {
    const { registrationId } = req.params;
    const { status } = req.body;

    const reg = await competitionRegistrationModel.findById(registrationId);
    if (!reg) {
        throw new NOT_FOUND('Registration not found');
    }

    reg.status = status;
    await reg.save();

    res.status(200).json({
        success: true,
        message: `Registration status updated to ${status} successfully`,
        data: reg
    });
});

export {
    getRegistrations,
    createRegistration,
    updateRegistrationStatus
};
