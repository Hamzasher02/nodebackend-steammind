import cleanupUploadedFiles, {
    handleCloudinaryUpload
} from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import logosModel from '../model/logos.model.js';
import { StatusCodes } from 'http-status-codes';
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
    res.status(StatusCodes.OK).json({
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
    const cloudResult = await handleCloudinaryUpload(req, req.file, logos.headerLogo?.publicId);

    logos.headerLogo = cloudResult;
    await logos.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
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
    const cloudResult = await handleCloudinaryUpload(req, req.file, logos.footerLogo?.publicId);

    logos.footerLogo = cloudResult;
    await logos.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
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
