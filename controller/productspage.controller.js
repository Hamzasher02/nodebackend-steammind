import fs from 'fs';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import productsPageModel from '../model/productspage.model.js';
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
async function getOrCreateProductsPage() {
    let page = await productsPageModel.findOne();
    if (!page) {
        page = await productsPageModel.create({
            hero: { backgroundImage: null, heading: '', subHeading: '' },
            sections: []
        });
    }
    return page;
}

// 1. Get Products Page Content
const getProductsPage = asyncWrapper(async (req, res) => {
    const page = await getOrCreateProductsPage();
    res.status(200).json({
        success: true,
        data: page
    });
});

// 2. Update Hero
const updateHero = asyncWrapper(async (req, res) => {
    const { heading, subHeading } = req.body;
    const page = await getOrCreateProductsPage();

    let newImage = page.hero.backgroundImage;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        if (page.hero.backgroundImage?.publicId) {
            await deleteFromCloud(page.hero.backgroundImage.publicId);
        }
        newImage = cloudResult;
    }

    if (heading !== undefined) page.hero.heading = heading;
    if (subHeading !== undefined) page.hero.subHeading = subHeading;
    page.hero.backgroundImage = newImage;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Products Page Hero section updated successfully',
        data: page.hero
    });
});

// 3. Add Section
const addSection = asyncWrapper(async (req, res) => {
    const { heading, description, blocks } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Product section image is required');
    }

    const page = await getOrCreateProductsPage();
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    let finalBlocks = [];
    if (blocks) {
        finalBlocks = typeof blocks === 'string' ? JSON.parse(blocks) : blocks;
    }

    const newSection = {
        image: cloudResult,
        heading,
        description,
        blocks: finalBlocks
    };

    page.sections.push(newSection);
    await page.save();
    safeCleanup(req);

    const added = page.sections[page.sections.length - 1];

    res.status(201).json({
        success: true,
        message: 'Product section added successfully',
        data: added
    });
});

// 4. Update Section
const updateSection = asyncWrapper(async (req, res) => {
    const { sectionId } = req.params;
    const { heading, description, blocks } = req.body;

    const page = await getOrCreateProductsPage();
    const section = page.sections.id(sectionId);

    if (!section) {
        safeCleanup(req);
        throw new NOT_FOUND('Product section not found');
    }

    let newImage = section.image;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        await deleteFromCloud(section.image.publicId);
        newImage = cloudResult;
    }

    if (heading !== undefined) section.heading = heading;
    if (description !== undefined) section.description = description;
    if (blocks !== undefined) {
        section.blocks = typeof blocks === 'string' ? JSON.parse(blocks) : blocks;
    }
    section.image = newImage;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Product section updated successfully',
        data: section
    });
});

// 5. Delete Section
const deleteSection = asyncWrapper(async (req, res) => {
    const { sectionId } = req.params;

    const page = await getOrCreateProductsPage();
    const section = page.sections.id(sectionId);

    if (!section) {
        throw new NOT_FOUND('Product section not found');
    }

    await deleteFromCloud(section.image.publicId);

    page.sections.pull(sectionId);
    await page.save();

    res.status(200).json({
        success: true,
        message: 'Product section deleted successfully'
    });
});

export {
    getProductsPage,
    updateHero,
    addSection,
    updateSection,
    deleteSection
};
