import cleanupUploadedFiles, {
    handleCloudinaryUpload,
    safeJsonParse
} from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import productsPageModel from '../model/productspage.model.js';
import { deleteFromCloud } from '../services/cloudinary.uploader.services.js';
import { StatusCodes } from 'http-status-codes';

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
    res.status(StatusCodes.OK).json({
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
        newImage = await handleCloudinaryUpload(req, req.file, page.hero.backgroundImage?.publicId);
    }

    if (heading !== undefined) page.hero.heading = heading;
    if (subHeading !== undefined) page.hero.subHeading = subHeading;
    page.hero.backgroundImage = newImage;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
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
    const cloudResult = await handleCloudinaryUpload(req, req.file);

    const finalBlocks = safeJsonParse(req, blocks, 'Invalid blocks JSON format') || [];

    const newSection = {
        image: cloudResult,
        heading,
        description,
        blocks: finalBlocks
    };

    page.sections.push(newSection);
    await page.save();
    cleanupUploadedFiles(req);

    const added = page.sections[page.sections.length - 1];

    res.status(StatusCodes.CREATED).json({
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
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Product section not found');
    }

    let newImage = section.image;
    if (req.file) {
        newImage = await handleCloudinaryUpload(req, req.file, section.image.publicId);
    }

    if (heading !== undefined) section.heading = heading;
    if (description !== undefined) section.description = description;
    if (blocks !== undefined) {
        section.blocks = safeJsonParse(req, blocks, 'Invalid blocks JSON format') || [];
    }
    section.image = newImage;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
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

    try {
        await deleteFromCloud(section.image.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting product section image from Cloudinary:", error);
    }

    page.sections.pull(sectionId);
    await page.save();

    res.status(StatusCodes.OK).json({
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
