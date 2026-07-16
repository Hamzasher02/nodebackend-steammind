import cleanupUploadedFiles, {
    handleCloudinaryUpload
} from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import contactUsPageModel from '../model/contactuspage.model.js';
import { deleteFromCloud } from '../services/cloudinary.uploader.services.js';
import { StatusCodes } from 'http-status-codes';

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
    res.status(StatusCodes.OK).json({
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
        newImage = await handleCloudinaryUpload(req, req.file, page.section1.backgroundImage?.publicId);
    }

    if (heading !== undefined) page.section1.heading = heading;
    if (paragraph !== undefined) page.section1.paragraph = paragraph;
    if (heading2 !== undefined) page.section1.heading2 = heading2;
    if (paragraph2 !== undefined) page.section1.paragraph2 = paragraph2;
    page.section1.backgroundImage = newImage;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
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
    const cloudResult = await handleCloudinaryUpload(req, req.file);

    const newLocation = {
        icon: cloudResult,
        location
    };

    page.locations.push(newLocation);
    await page.save();
    cleanupUploadedFiles(req);

    const added = page.locations[page.locations.length - 1];

    res.status(StatusCodes.CREATED).json({
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
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Location card not found');
    }

    let newIcon = locCard.icon;
    if (req.file) {
        newIcon = await handleCloudinaryUpload(req, req.file, locCard.icon.publicId);
    }

    if (location !== undefined) locCard.location = location;
    locCard.icon = newIcon;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
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

    try {
        await deleteFromCloud(locCard.icon.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting location icon from Cloudinary:", error);
    }

    page.locations.pull(locationId);
    await page.save();

    res.status(StatusCodes.OK).json({
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
