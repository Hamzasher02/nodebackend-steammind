import express from 'express';
import * as ctrl from '../controller/productspage.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import {
    uploadProductsHeroImage,
    uploadProductSectionImage
} from '../middleware/productspage.multer.middleware.js';

const router = express.Router();

// Public
router.get('/', ctrl.getProductsPage);

// Protected (Website Manager)
router.patch('/hero', authenticationMiddleware, uploadProductsHeroImage, ctrl.updateHero);
router.post('/sections', authenticationMiddleware, uploadProductSectionImage, ctrl.addSection);
router.patch('/sections/:sectionId', authenticationMiddleware, uploadProductSectionImage, ctrl.updateSection);
router.delete('/sections/:sectionId', authenticationMiddleware, ctrl.deleteSection);

export default router;

