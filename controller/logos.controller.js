import fs from 'fs';
import { BAD_REQUEST } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import logosModel from '../model/logos.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Safe cleanup function to remove local uploads
function safeCleanup(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
}

// Helper to get or create logos document
async function getOrCreateLogos() {
    let logos = await logosModel.findOne();
    if (!logos) {
        logos = await logosModel.create({
            headerLogo: null,
            footerLogo: null
        });
    }
    return logos;
}

// 1. Get Logos
const getLogos = asyncWrapper(async (req, res) => {
    const logos = await getOrCreateLogos();
    res.status(200).json({
        success: true,
        data: logos
    });
});

// 2. Update Header Logo
const updateHeaderLogo = asyncWrapper(async (req, res) => {
    if (!req.file) {
        throw new BAD_REQUEST('Header logo image is required');
    }

    const logos = await getOrCreateLogos();
    let cloudResult;
    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    if (logos.headerLogo?.publicId) {
        await deleteFromCloud(logos.headerLogo.publicId);
    }

    logos.headerLogo = cloudResult;
    await logos.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Header logo updated successfully',
        data: logos
    });
});

// 3. Update Footer Logo
const updateFooterLogo = asyncWrapper(async (req, res) => {
    if (!req.file) {
        throw new BAD_REQUEST('Footer logo image is required');
    }

    const logos = await getOrCreateLogos();
    let cloudResult;
    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    if (logos.footerLogo?.publicId) {
        await deleteFromCloud(logos.footerLogo.publicId);
    }

    logos.footerLogo = cloudResult;
    await logos.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Footer logo updated successfully',
        data: logos
    });
});

export {
    getLogos,
    updateHeaderLogo,
    updateFooterLogo
};
