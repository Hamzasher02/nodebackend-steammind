import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    uploadContactBgImage,
    uploadLocationIcon
} from '../middleware/contactuspage.multer.middleware.js';
import {
    getContactUsPage,
    updateSection1,
    addLocation,
    updateLocation,
    deleteLocation
} from '../controller/contactuspage.controller.js';
import {
    contactSection1Validator,
    locationValidator
} from '../services/contactuspage.validator.services.js';

const router = express.Router();

// 1. Get Contact Us Page Content (Public)
router.route('/')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get contact us page content request'),
        getContactUsPage
    );

// 2. Update Section 1
router.route('/section1')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadContactBgImage,
        contactSection1Validator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update contact us page section 1 request'),
        updateSection1
    );

// 3. Add Location Card
router.route('/locations')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadLocationIcon,
        locationValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add contact location card request'),
        addLocation
    );

// 4. Update / Delete Location Card
router.route('/locations/:locationId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadLocationIcon,
        locationValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update contact location card request'),
        updateLocation
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete contact location card request'),
        deleteLocation
    );

export default router;
