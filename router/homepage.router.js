import express from 'express';
import * as ctrl from '../controller/homepage.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import {
    uploadHeroImages,
    uploadEventImage,
    uploadBrandCardFiles
} from '../middleware/homepage.multer.middleware.js';

const router = express.Router();

// Public Read-Only Endpoint
router.get('/', ctrl.getHomepage);

// Protected Website Manager Endpoints (Requires Auth)
router.patch('/hero', authenticationMiddleware, uploadHeroImages, ctrl.updateHero);
router.post('/events', authenticationMiddleware, uploadEventImage, ctrl.addEvent);
router.patch('/events/:eventId', authenticationMiddleware, uploadEventImage, ctrl.updateEvent);
router.delete('/events/:eventId', authenticationMiddleware, ctrl.deleteEvent);
router.patch('/about-us', authenticationMiddleware, ctrl.updateAboutUs);
router.post('/brand-cards', authenticationMiddleware, uploadBrandCardFiles, ctrl.addBrandCard);
router.patch('/brand-cards/:cardId', authenticationMiddleware, uploadBrandCardFiles, ctrl.updateBrandCard);
router.delete('/brand-cards/:cardId', authenticationMiddleware, ctrl.deleteBrandCard);

export default router;


