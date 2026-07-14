import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import {
    uploadHeaderLogo,
    uploadFooterLogo
} from '../middleware/logos.multer.middleware.js';
import {
    getLogos,
    updateHeaderLogo,
    updateFooterLogo
} from '../controller/logos.controller.js';

const router = express.Router();

// 1. Get Logos (Public)
router.route('/')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get header and footer logos request'),
        getLogos
    );

// 2. Update Header Logo
router.route('/header')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadHeaderLogo,
        activityLogger('WEBSITE_MANAGEMENT', 'Update header logo request'),
        updateHeaderLogo
    );

// 3. Update Footer Logo
router.route('/footer')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadFooterLogo,
        activityLogger('WEBSITE_MANAGEMENT', 'Update footer logo request'),
        updateFooterLogo
    );

export default router;
