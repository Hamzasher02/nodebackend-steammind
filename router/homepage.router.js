import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    uploadHeroImages,
    uploadEventImage,
    uploadBrandCardFiles
} from '../middleware/homepage.multer.middleware.js';
import {
    getHomepage,
    updateHero,
    addEvent,
    updateEvent,
    deleteEvent,
    updateAboutUs,
    addBrandCard,
    updateBrandCard,
    deleteBrandCard
} from '../controller/homepage.controller.js';
import {
    updateHeroValidator,
    eventValidator,
    updateAboutUsValidator,
    brandCardValidator
} from '../services/homepage.validator.services.js';

const router = express.Router();

// 1. Get Homepage Content (Public)
router.route('/')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get homepage content request'),
        getHomepage
    );

// 2. Update Hero Section
router.route('/hero')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadHeroImages,
        updateHeroValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update hero section request'),
        updateHero
    );

// 3. Add Event
router.route('/events')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadEventImage,
        eventValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add homepage event request'),
        addEvent
    );

// 4. Update Event / Delete Event
router.route('/events/:eventId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadEventImage,
        eventValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update homepage event request'),
        updateEvent
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete homepage event request'),
        deleteEvent
    );

// 5. Update About Us Section
router.route('/about-us')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        updateAboutUsValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update about us section request'),
        updateAboutUs
    );

// 6. Add Brand Card
router.route('/brand-cards')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadBrandCardFiles,
        brandCardValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add brand card request'),
        addBrandCard
    );

// 7. Update Brand Card / Delete Brand Card
router.route('/brand-cards/:cardId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadBrandCardFiles,
        brandCardValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update brand card request'),
        updateBrandCard
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete brand card request'),
        deleteBrandCard
    );

export default router;
