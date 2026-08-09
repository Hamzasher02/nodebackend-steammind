import cleanupUploadedFiles, {
    handleCloudinaryUpload
} from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import logosModel from '../model/logos.model.js';
import { StatusCodes } from 'http-status-codes';

// Helper to get or create logos document singleton
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

// 1. Get Logos (Public)
const getLogos = asyncWrapper(async (req, res) => {
    const logos = await getOrCreateLogos();
    res.status(StatusCodes.OK).json({
        success: true,
        data: logos
    });
});

// 2. Unified Logos Update Controller (Professional Industry Standard)
// Supports updating headerLogo, footerLogo, or both in a single PATCH / request,
// while remaining 100% backward compatible with /header and /footer routes.
const updateLogosUnified = asyncWrapper(async (req, res) => {
    const logos = await getOrCreateLogos();
    const { headerLogo, footerLogo, image, logo } = req.body;

    let updated = false;

    // Handle Header Logo
    if (req.files?.headerLogo?.[0] || req.file) {
        const fileToUpload = req.files?.headerLogo?.[0] || req.file;
        logos.headerLogo = await handleCloudinaryUpload(req, fileToUpload, logos.headerLogo?.publicId);
        updated = true;
    } else if (headerLogo || (req.path.includes('header') && (image || logo))) {
        const urlStr = headerLogo || image || logo;
        if (typeof urlStr === 'string') {
            logos.headerLogo = { publicId: urlStr, secureUrl: urlStr };
            updated = true;
        }
    }

    // Handle Footer Logo
    if (req.files?.footerLogo?.[0]) {
        logos.footerLogo = await handleCloudinaryUpload(req, req.files.footerLogo[0], logos.footerLogo?.publicId);
        updated = true;
    } else if (footerLogo || (req.path.includes('footer') && (image || logo))) {
        const urlStr = footerLogo || image || logo;
        if (typeof urlStr === 'string') {
            logos.footerLogo = { publicId: urlStr, secureUrl: urlStr };
            updated = true;
        }
    }

    if (!updated && !req.file && !req.files) {
        throw new BAD_REQUEST('At least one logo image (headerLogo or footerLogo) is required');
    }

    await logos.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Logos updated successfully',
        data: logos
    });
});

// Individual Route Handlers (Aliased to Unified Handler for REST Contract Compatibility)
const updateHeaderLogo = updateLogosUnified;
const updateFooterLogo = updateLogosUnified;

export {
    getLogos,
    updateLogosUnified,
    updateHeaderLogo,
    updateFooterLogo
};
