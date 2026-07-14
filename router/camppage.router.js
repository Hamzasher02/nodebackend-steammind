import express from 'express';
import { BAD_REQUEST } from '../error/error.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    uploadCampSectionImage,
    uploadCampDetailIcon
} from '../middleware/camppage.multer.middleware.js';
import {
    getCampPage,
    updateSection1,
    addDetailItem,
    updateDetailItem,
    deleteDetailItem,
    addAdvantageCard,
    updateAdvantageCard,
    deleteAdvantageCard
} from '../controller/camppage.controller.js';
import {
    campSection1Validator,
    campDetailValidator,
    advantageValidator
} from '../services/camppage.validator.services.js';

const router = express.Router();

// Validate pageType parameter
router.param('pageType', (req, res, next, val) => {
    if (!['summer', 'winter'].includes(val)) {
        return next(new BAD_REQUEST('Invalid camp page type. Must be "summer" or "winter"'));
    }
    next();
});

// 1. Get Camp Page Content (Public)
router.route('/:pageType')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get camp page content request'),
        getCampPage
    );

// 2. Update Section 1
router.route('/:pageType/section1')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadCampSectionImage,
        campSection1Validator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update camp page section 1 request'),
        updateSection1
    );

// 3. Add Detail Item
router.route('/:pageType/details')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadCampDetailIcon,
        campDetailValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add camp page detail item request'),
        addDetailItem
    );

// 4. Update / Delete Detail Item
router.route('/:pageType/details/:detailId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadCampDetailIcon,
        campDetailValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update camp page detail item request'),
        updateDetailItem
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete camp page detail item request'),
        deleteDetailItem
    );

// 5. Add Advantage Card
router.route('/:pageType/advantages')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        advantageValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add camp page advantage card request'),
        addAdvantageCard
    );

// 6. Update / Delete Advantage Card
router.route('/:pageType/advantages/:advantageId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        advantageValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update camp page advantage card request'),
        updateAdvantageCard
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete camp page advantage card request'),
        deleteAdvantageCard
    );

export default router;
