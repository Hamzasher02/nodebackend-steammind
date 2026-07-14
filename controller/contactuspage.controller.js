import fs from 'fs';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import contactUsPageModel from '../model/contactuspage.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Safe cleanup function to remove local uploads
function safeCleanup(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
}

// Helper to get or create the page document
async function getOrCreateContactUsPage() {
    let page = await contactUsPageModel.findOne();
    if (!page) {
        page = await contactUsPageModel.create({
            section1: { backgroundImage: null, heading: '', paragraph: '', heading2: '', paragraph2: '' },
            locations: []
        });
    }
    return page;
}

// 1. Get Contact Us Page Content
const getContactUsPage = asyncWrapper(async (req, res) => {
    const page = await getOrCreateContactUsPage();
    res.status(200).json({
        success: true,
        data: page
    });
});

// 2. Update Section 1
const updateSection1 = asyncWrapper(async (req, res) => {
    const { heading, paragraph, heading2, paragraph2 } = req.body;
    const page = await getOrCreateContactUsPage();

    let newImage = page.section1.backgroundImage;

    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        if (page.section1.backgroundImage?.publicId) {
            await deleteFromCloud(page.section1.backgroundImage.publicId);
        }
        newImage = cloudResult;
    }

    if (heading !== undefined) page.section1.heading = heading;
    if (paragraph !== undefined) page.section1.paragraph = paragraph;
    if (heading2 !== undefined) page.section1.heading2 = heading2;
    if (paragraph2 !== undefined) page.section1.paragraph2 = paragraph2;
    page.section1.backgroundImage = newImage;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Section 1 updated successfully',
        data: page.section1
    });
});

// 3. Add Location Card
const addLocation = asyncWrapper(async (req, res) => {
    const { location } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Location icon is required');
    }

    const page = await getOrCreateContactUsPage();
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    const newLocation = {
        icon: cloudResult,
        location
    };

    page.locations.push(newLocation);
    await page.save();
    safeCleanup(req);

    const added = page.locations[page.locations.length - 1];

    res.status(201).json({
        success: true,
        message: 'Location card added successfully',
        data: added
    });
});

// 4. Update Location Card
const updateLocation = asyncWrapper(async (req, res) => {
    const { locationId } = req.params;
    const { location } = req.body;

    const page = await getOrCreateContactUsPage();
    const locCard = page.locations.id(locationId);

    if (!locCard) {
        safeCleanup(req);
        throw new NOT_FOUND('Location card not found');
    }

    let newIcon = locCard.icon;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        await deleteFromCloud(locCard.icon.publicId);
        newIcon = cloudResult;
    }

    if (location !== undefined) locCard.location = location;
    locCard.icon = newIcon;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Location card updated successfully',
        data: locCard
    });
});

// 5. Delete Location Card
const deleteLocation = asyncWrapper(async (req, res) => {
    const { locationId } = req.params;

    const page = await getOrCreateContactUsPage();
    const locCard = page.locations.id(locationId);

    if (!locCard) {
        throw new NOT_FOUND('Location card not found');
    }

    await deleteFromCloud(locCard.icon.publicId);

    page.locations.pull(locationId);
    await page.save();

    res.status(200).json({
        success: true,
        message: 'Location card deleted successfully'
    });
});

export {
    getContactUsPage,
    updateSection1,
    addLocation,
    updateLocation,
    deleteLocation
};
