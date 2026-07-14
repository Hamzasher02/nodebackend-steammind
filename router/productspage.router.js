import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    uploadProductsHeroImage,
    uploadProductSectionImage
} from '../middleware/productspage.multer.middleware.js';
import {
    getProductsPage,
    updateHero,
    addSection,
    updateSection,
    deleteSection
} from '../controller/productspage.controller.js';
import {
    updateProductsHeroValidator,
    productSectionValidator
} from '../services/productspage.validator.services.js';

const router = express.Router();

// 1. Get Products Page Content (Public)
router.route('/')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get products page content request'),
        getProductsPage
    );

// 2. Update Hero
router.route('/hero')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadProductsHeroImage,
        updateProductsHeroValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update products page hero section request'),
        updateHero
    );

// 3. Add Section
router.route('/sections')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadProductSectionImage,
        productSectionValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add product section request'),
        addSection
    );

// 4. Update Section / Delete Section
router.route('/sections/:sectionId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadProductSectionImage,
        productSectionValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update product section request'),
        updateSection
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete product section request'),
        deleteSection
    );

export default router;
