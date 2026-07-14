import fs from 'fs';
import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import homepageModel from '../model/homepage.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Safe cleanup function that supports req.file, req.files as Array, and req.files as Object (multer.fields)
function safeCleanup(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting single file:', err);
        });
    }
    if (req.files) {
        if (Array.isArray(req.files)) {
            req.files.forEach((f) => {
                fs.unlink(f.path, (err) => {
                    if (err) console.error('Error deleting array file:', err);
                });
            });
        } else {
            Object.keys(req.files).forEach((key) => {
                req.files[key].forEach((f) => {
                    fs.unlink(f.path, (err) => {
                        if (err) console.error(`Error deleting field file [${key}]:`, err);
                    });
                });
            });
        }
    }
}

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
    res.status(200).json({
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
        let keptImages = [];
        try {
            keptImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        } catch (err) {
            safeCleanup(req);
            throw new BAD_REQUEST('Invalid existingImages JSON format');
        }

        // Find images to delete from Cloudinary
        const keptPublicIds = new Set(keptImages.map(img => img.publicId));
        const imagesToDelete = homepage.hero.backgroundImages.filter(img => !keptPublicIds.has(img.publicId));

        for (const img of imagesToDelete) {
            await deleteFromCloud(img.publicId);
        }

        finalBackgroundImages = homepage.hero.backgroundImages.filter(img => keptPublicIds.has(img.publicId));
    }

    // Upload new files if provided
    if (req.files && req.files.length > 0) {
        const uploadedImages = [];
        try {
            for (const file of req.files) {
                const cloudResult = await uploadToCloud(file.path);
                uploadedImages.push(cloudResult);
            }
        } catch (err) {
            // Clean up any uploaded to Cloudinary in this failure batch
            for (const img of uploadedImages) {
                await deleteFromCloud(img.publicId);
            }
            safeCleanup(req);
            throw err;
        }
        finalBackgroundImages.push(...uploadedImages);
    }

    if (title !== undefined) homepage.hero.title = title;
    if (subtitle !== undefined) homepage.hero.subtitle = subtitle;
    homepage.hero.backgroundImages = finalBackgroundImages;

    await homepage.save();
    safeCleanup(req);

    res.status(200).json({
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
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    const newEvent = {
        image: cloudResult,
        name,
        location,
        year
    };

    homepage.events.push(newEvent);
    await homepage.save();
    safeCleanup(req);

    // Get the newly added event with its auto-generated ID
    const addedEvent = homepage.events[homepage.events.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Event not found');
    }

    let newImage = event.image;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }
        // Delete old image from Cloudinary
        await deleteFromCloud(event.image.publicId);
        newImage = cloudResult;
    }

    if (name !== undefined) event.name = name;
    if (location !== undefined) event.location = location;
    if (year !== undefined) event.year = year;
    event.image = newImage;

    await homepage.save();
    safeCleanup(req);

    res.status(200).json({
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
    await deleteFromCloud(event.image.publicId);

    // Remove from array
    homepage.events.pull(eventId);
    await homepage.save();

    res.status(200).json({
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

    res.status(200).json({
        success: true,
        message: 'About Us section updated successfully',
        data: homepage.aboutUs
    });
});

// 7. Add Brand Card
const addBrandCard = asyncWrapper(async (req, res) => {
    const { heading, paragraphs } = req.body;

    if (!req.files || !req.files['image'] || !req.files['icon']) {
        safeCleanup(req);
        throw new BAD_REQUEST('Both image and icon are required for a brand card');
    }

    const homepage = await getOrCreateHomepage();
    let imageCloud, iconCloud;

    try {
        imageCloud = await uploadToCloud(req.files['image'][0].path);
        iconCloud = await uploadToCloud(req.files['icon'][0].path);
    } catch (err) {
        // Clean up Cloudinary if one succeeded
        if (imageCloud) await deleteFromCloud(imageCloud.publicId);
        if (iconCloud) await deleteFromCloud(iconCloud.publicId);
        safeCleanup(req);
        throw err;
    }

    // Parse paragraphs if sent as JSON string
    let finalParagraphs = [];
    if (paragraphs) {
        finalParagraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }

    const newCard = {
        image: imageCloud,
        icon: iconCloud,
        heading,
        paragraphs: finalParagraphs
    };

    homepage.brandCards.push(newCard);
    await homepage.save();
    safeCleanup(req);

    const addedCard = homepage.brandCards[homepage.brandCards.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Brand card not found');
    }

    let newImage = card.image;
    let newIcon = card.icon;

    try {
        if (req.files && req.files['image']) {
            const cloudResult = await uploadToCloud(req.files['image'][0].path);
            await deleteFromCloud(card.image.publicId);
            newImage = cloudResult;
        }

        if (req.files && req.files['icon']) {
            const cloudResult = await uploadToCloud(req.files['icon'][0].path);
            await deleteFromCloud(card.icon.publicId);
            newIcon = cloudResult;
        }
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    // Parse paragraphs if provided
    if (paragraphs !== undefined) {
        card.paragraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }

    if (heading !== undefined) card.heading = heading;
    card.image = newImage;
    card.icon = newIcon;

    await homepage.save();
    safeCleanup(req);

    res.status(200).json({
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
    await deleteFromCloud(card.image.publicId);
    await deleteFromCloud(card.icon.publicId);

    // Remove from array
    homepage.brandCards.pull(cardId);
    await homepage.save();

    res.status(200).json({
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
