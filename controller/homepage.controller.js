import cleanupUploadedFiles, {
    handleCloudinaryUpload,
    handleMultipleCloudinaryUploads,
    safeJsonParse
} from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import homepageModel from '../model/homepage.model.js';
import { deleteFromCloud } from '../services/cloudinary.uploader.services.js';
import { StatusCodes } from 'http-status-codes';

// Helper to get or create homepage document
async function getOrCreateHomepage() {
    let homepage = await homepageModel.findOne();
    if (!homepage) {
        homepage = await homepageModel.create({
            hero: { backgroundImages: [], title: '', subtitle: '' },
            events: [],
            aboutUs: { description: '' },
            brandCards: []
        });
    }
    return homepage;
}

// 1. Get Homepage Content
const getHomepage = asyncWrapper(async (req, res) => {
    const homepage = await getOrCreateHomepage();
    res.status(StatusCodes.OK).json({
        success: true,
        data: homepage
    });
});

// 2. Update Hero Section
const updateHero = asyncWrapper(async (req, res) => {
    const { title, subtitle, existingImages } = req.body;
    const homepage = await getOrCreateHomepage();

    let finalBackgroundImages = [...homepage.hero.backgroundImages];

    // Parse existingImages if sent from frontend to know which images to keep
    if (existingImages) {
        const keptImages = safeJsonParse(req, existingImages, 'Invalid existingImages JSON format');
        const keptPublicIds = new Set(keptImages.map(img => img.publicId));
        const imagesToDelete = homepage.hero.backgroundImages.filter(img => !keptPublicIds.has(img.publicId));

        for (const img of imagesToDelete) {
            try {
                await deleteFromCloud(img.publicId);
            } catch (delErr) {
                console.error("Non-blocking error deleting old hero background asset from Cloudinary:", delErr);
            }
        }

        finalBackgroundImages = homepage.hero.backgroundImages.filter(img => keptPublicIds.has(img.publicId));
    }

    // Upload new files if provided
    if (req.files && req.files.length > 0) {
        const uploadedImages = await handleMultipleCloudinaryUploads(req, req.files);
        finalBackgroundImages.push(...uploadedImages);
    }

    if (title !== undefined) homepage.hero.title = title;
    if (subtitle !== undefined) homepage.hero.subtitle = subtitle;
    homepage.hero.backgroundImages = finalBackgroundImages;

    await homepage.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Hero section updated successfully',
        data: homepage.hero
    });
});

// 3. Add Event
const addEvent = asyncWrapper(async (req, res) => {
    const { name, location, year } = req.body;
    if (!req.file) {
        throw new BAD_REQUEST('Event image is required');
    }

    const homepage = await getOrCreateHomepage();
    const cloudResult = await handleCloudinaryUpload(req, req.file);

    const newEvent = {
        image: cloudResult,
        name,
        location,
        year
    };

    homepage.events.push(newEvent);
    await homepage.save();
    cleanupUploadedFiles(req);

    // Get the newly added event with its auto-generated ID
    const addedEvent = homepage.events[homepage.events.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Event added successfully',
        data: addedEvent
    });
});

// 4. Update Event
const updateEvent = asyncWrapper(async (req, res) => {
    const { eventId } = req.params;
    const { name, location, year } = req.body;

    const homepage = await getOrCreateHomepage();
    const event = homepage.events.id(eventId);

    if (!event) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Event not found');
    }

    let newImage = event.image;
    if (req.file) {
        newImage = await handleCloudinaryUpload(req, req.file, event.image.publicId);
    }

    if (name !== undefined) event.name = name;
    if (location !== undefined) event.location = location;
    if (year !== undefined) event.year = year;
    event.image = newImage;

    await homepage.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Event updated successfully',
        data: event
    });
});

// 5. Delete Event
const deleteEvent = asyncWrapper(async (req, res) => {
    const { eventId } = req.params;

    const homepage = await getOrCreateHomepage();
    const event = homepage.events.id(eventId);

    if (!event) {
        throw new NOT_FOUND('Event not found');
    }

    // Delete image from Cloudinary
    try {
        await deleteFromCloud(event.image.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting event image from Cloudinary:", error);
    }

    // Remove from array
    homepage.events.pull(eventId);
    await homepage.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Event deleted successfully'
    });
});

// 6. Update About Us Section
const updateAboutUs = asyncWrapper(async (req, res) => {
    const { description } = req.body;

    const homepage = await getOrCreateHomepage();
    homepage.aboutUs.description = description;

    await homepage.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'About Us section updated successfully',
        data: homepage.aboutUs
    });
});

// 7. Add Brand Card
const addBrandCard = asyncWrapper(async (req, res) => {
    const { heading, paragraphs } = req.body;

    if (!req.files || !req.files['image'] || !req.files['icon']) {
        cleanupUploadedFiles(req);
        throw new BAD_REQUEST('Both image and icon are required for a brand card');
    }

    const homepage = await getOrCreateHomepage();
    let imageCloud, iconCloud;

    imageCloud = await handleCloudinaryUpload(req, req.files['image'][0]);
    try {
        iconCloud = await handleCloudinaryUpload(req, req.files['icon'][0]);
    } catch (err) {
        if (imageCloud) await deleteFromCloud(imageCloud.publicId);
        throw err;
    }

    // Parse paragraphs if sent as JSON string
    const finalParagraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];

    const newCard = {
        image: imageCloud,
        icon: iconCloud,
        heading,
        paragraphs: finalParagraphs
    };

    homepage.brandCards.push(newCard);
    await homepage.save();
    cleanupUploadedFiles(req);

    const addedCard = homepage.brandCards[homepage.brandCards.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Brand card added successfully',
        data: addedCard
    });
});

// 8. Update Brand Card
const updateBrandCard = asyncWrapper(async (req, res) => {
    const { cardId } = req.params;
    const { heading, paragraphs } = req.body;

    const homepage = await getOrCreateHomepage();
    const card = homepage.brandCards.id(cardId);

    if (!card) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Brand card not found');
    }

    let newImage = card.image;
    let newIcon = card.icon;

    if (req.files && req.files['image']) {
        newImage = await handleCloudinaryUpload(req, req.files['image'][0], card.image.publicId);
    }

    if (req.files && req.files['icon']) {
        newIcon = await handleCloudinaryUpload(req, req.files['icon'][0], card.icon.publicId);
    }

    // Parse paragraphs if provided
    if (paragraphs !== undefined) {
        card.paragraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];
    }

    if (heading !== undefined) card.heading = heading;
    card.image = newImage;
    card.icon = newIcon;

    await homepage.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Brand card updated successfully',
        data: card
    });
});

// 9. Delete Brand Card
const deleteBrandCard = asyncWrapper(async (req, res) => {
    const { cardId } = req.params;

    const homepage = await getOrCreateHomepage();
    const card = homepage.brandCards.id(cardId);

    if (!card) {
        throw new NOT_FOUND('Brand card not found');
    }

    // Delete image and icon from Cloudinary
    try {
        await deleteFromCloud(card.image.publicId);
        await deleteFromCloud(card.icon.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting brand card assets from Cloudinary:", error);
    }

    // Remove from array
    homepage.brandCards.pull(cardId);
    await homepage.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Brand card deleted successfully'
    });
});

export {
    getHomepage,
    updateHero,
    addEvent,
    updateEvent,
    deleteEvent,
    updateAboutUs,
    addBrandCard,
    updateBrandCard,
    deleteBrandCard
};
