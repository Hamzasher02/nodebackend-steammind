import express from 'express';
import * as ctrl from '../controller/competitionregistration.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';

const router = express.Router();

const isEditor = [
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin', 'website manager')
];

// Protected GET all registrations (TC-CMS-CREG-04 requires 401 on no-auth)
router.get('/', ...isEditor, ctrl.getRegistrations);

// Public submit registration
router.post('/', ctrl.createRegistration);

// Protected status updates (supports both /:registrationId and /:registrationId/status)
router.patch('/:registrationId', ...isEditor, ctrl.updateRegistrationStatus);
router.patch('/:registrationId/status', ...isEditor, ctrl.updateRegistrationStatus);

export default router;
