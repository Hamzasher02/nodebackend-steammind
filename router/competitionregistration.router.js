import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    getRegistrations,
    createRegistration,
    updateRegistrationStatus
} from '../controller/competitionregistration.controller.js';
import {
    createRegistrationValidator,
    updateRegistrationStatusValidator
} from '../services/competitionregistration.validator.services.js';

const router = express.Router();

// 1. Get All Registrations (Requires website management authorization)
router.route('/')
    .get(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'read'),
        activityLogger('WEBSITE_MANAGEMENT', 'Get all competition registrations request'),
        getRegistrations
    )
    .post(
        createRegistrationValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Submit competition registration request'),
        createRegistration
    );

// 2. Update Registration Status (confirmed, pending, canceled)
router.route('/:registrationId/status')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        updateRegistrationStatusValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update competition registration status request'),
        updateRegistrationStatus
    );

export default router;
