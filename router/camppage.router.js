import express from 'express';
import * as ctrl from '../controller/camppage.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import {
    uploadCampSectionImage,
    uploadCampDetailIcon
} from '../middleware/camppage.multer.middleware.js';

const router = express.Router();

const isManager = [
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin', 'website manager')
];

// Public
router.get('/:pageType', ctrl.getCampPage);

// Protected — Website Manager / Admin only
router.patch('/:pageType/section1', ...isManager, uploadCampSectionImage, ctrl.updateSection1);

router.post('/:pageType/details', ...isManager, uploadCampDetailIcon, ctrl.addDetailItem);
router.patch('/:pageType/details/:detailId', ...isManager, uploadCampDetailIcon, ctrl.updateDetailItem);
router.delete('/:pageType/details/:detailId', ...isManager, ctrl.deleteDetailItem);

router.post('/:pageType/advantages', ...isManager, ctrl.addAdvantageCard);
router.patch('/:pageType/advantages/:advantageId', ...isManager, ctrl.updateAdvantageCard);
router.delete('/:pageType/advantages/:advantageId', ...isManager, ctrl.deleteAdvantageCard);

export default router;
