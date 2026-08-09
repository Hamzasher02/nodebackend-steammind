import express from 'express';
import * as ctrl from '../controller/contactuspage.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import {
    uploadContactBgImage,
    uploadLocationIcon
} from '../middleware/contactuspage.multer.middleware.js';

const router = express.Router();

// Role restriction helper
const managerOrAdmin = roleAuthorizationMiddleware('admin', 'website manager');

// Public
router.get('/', ctrl.getContactUsPage);

// Protected (Website Manager / Super Admin Only)
router.patch('/section1', authenticationMiddleware, managerOrAdmin, uploadContactBgImage, ctrl.updateSection1);
router.post('/locations', authenticationMiddleware, managerOrAdmin, uploadLocationIcon, ctrl.addLocation);
router.patch('/locations/:locationId', authenticationMiddleware, managerOrAdmin, uploadLocationIcon, ctrl.updateLocation);
router.delete('/locations/:locationId', authenticationMiddleware, managerOrAdmin, ctrl.deleteLocation);

export default router;

