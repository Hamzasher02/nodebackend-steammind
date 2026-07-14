import fs from 'fs';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import campPageModel from '../model/camppage.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Safe cleanup function to remove local uploads
function safeCleanup(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
}

// Helper to get or create camp page document based on pageType (summer/winter)
async function getOrCreateCampPage(pageType) {
    let page = await campPageModel.findOne({ pageType });
    if (!page) {
        page = await campPageModel.create({
            pageType,
            section1: { image: null, heading: '', paragraphs: [] },
            details: [],
            advantages: []
        });
    }
    return page;
}

// 1. Get Camp Page Content
const getCampPage = asyncWrapper(async (req, res) => {
    const { pageType } = req.params;
    const page = await getOrCreateCampPage(pageType);
    res.status(200).json({
        success: true,
        data: page
    });
});

// 2. Update Section 1
const updateSection1 = asyncWrapper(async (req, res) => {
    const { pageType } = req.params;
    const { heading, paragraphs } = req.body;

    const page = await getOrCreateCampPage(pageType);
    let newImage = page.section1.image;

    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        if (page.section1.image?.publicId) {
            await deleteFromCloud(page.section1.image.publicId);
        }
        newImage = cloudResult;
    }

    if (heading !== undefined) page.section1.heading = heading;
    if (paragraphs !== undefined) {
        page.section1.paragraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }
    page.section1.image = newImage;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Section 1 updated successfully',
        data: page.section1
    });
});

// 3. Add Detail Item
const addDetailItem = asyncWrapper(async (req, res) => {
    const { pageType } = req.params;
    const { label, value } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Detail icon image is required');
    }

    const page = await getOrCreateCampPage(pageType);
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    const newDetail = {
        icon: cloudResult,
        label,
        value
    };

    page.details.push(newDetail);
    await page.save();
    safeCleanup(req);

    const added = page.details[page.details.length - 1];

    res.status(201).json({
        success: true,
        message: 'Detail item added successfully',
        data: added
    });
});

// 4. Update Detail Item
const updateDetailItem = asyncWrapper(async (req, res) => {
    const { pageType, detailId } = req.params;
    const { label, value } = req.body;

    const page = await getOrCreateCampPage(pageType);
    const detail = page.details.id(detailId);

    if (!detail) {
        safeCleanup(req);
        throw new NOT_FOUND('Detail item not found');
    }

    let newIcon = detail.icon;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        await deleteFromCloud(detail.icon.publicId);
        newIcon = cloudResult;
    }

    if (label !== undefined) detail.label = label;
    if (value !== undefined) detail.value = value;
    detail.icon = newIcon;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Detail item updated successfully',
        data: detail
    });
});

// 5. Delete Detail Item
const deleteDetailItem = asyncWrapper(async (req, res) => {
    const { pageType, detailId } = req.params;

    const page = await getOrCreateCampPage(pageType);
    const detail = page.details.id(detailId);

    if (!detail) {
        throw new NOT_FOUND('Detail item not found');
    }

    await deleteFromCloud(detail.icon.publicId);

    page.details.pull(detailId);
    await page.save();

    res.status(200).json({
        success: true,
        message: 'Detail item deleted successfully'
    });
});

// 6. Add Advantage Card
const addAdvantageCard = asyncWrapper(async (req, res) => {
    const { pageType } = req.params;
    const { title, description } = req.body;

    const page = await getOrCreateCampPage(pageType);

    const newAdv = {
        title,
        description
    };

    page.advantages.push(newAdv);
    await page.save();

    const added = page.advantages[page.advantages.length - 1];

    res.status(201).json({
        success: true,
        message: 'Advantage card added successfully',
        data: added
    });
});

// 7. Update Advantage Card
const updateAdvantageCard = asyncWrapper(async (req, res) => {
    const { pageType, advantageId } = req.params;
    const { title, description } = req.body;

    const page = await getOrCreateCampPage(pageType);
    const adv = page.advantages.id(advantageId);

    if (!adv) {
        throw new NOT_FOUND('Advantage card not found');
    }

    if (title !== undefined) adv.title = title;
    if (description !== undefined) adv.description = description;

    await page.save();

    res.status(200).json({
        success: true,
        message: 'Advantage card updated successfully',
        data: adv
    });
});

// 8. Delete Advantage Card
const deleteAdvantageCard = asyncWrapper(async (req, res) => {
    const { pageType, advantageId } = req.params;

    const page = await getOrCreateCampPage(pageType);
    const adv = page.advantages.id(advantageId);

    if (!adv) {
        throw new NOT_FOUND('Advantage card not found');
    }

    page.advantages.pull(advantageId);
    await page.save();

    res.status(200).json({
        success: true,
        message: 'Advantage card deleted successfully'
    });
});

export {
    getCampPage,
    updateSection1,
    addDetailItem,
    updateDetailItem,
    deleteDetailItem,
    addAdvantageCard,
    updateAdvantageCard,
    deleteAdvantageCard
};
