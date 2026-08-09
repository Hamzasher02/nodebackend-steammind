import express from 'express';
import * as ctrl from '../controller/logos.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

const isEditor = [
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin', 'website manager')
];

const uploadFields = upload.fields([
    { name: 'headerLogo', maxCount: 1 },
    { name: 'footerLogo', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]);

// Public Endpoint
router.get('/', ctrl.getLogos);

// Unified PATCH Endpoint (Industry Standard Best Practice)
router.patch('/', ...isEditor, uploadFields, ctrl.updateLogosUnified);

// Fine-grained Endpoint Aliases for REST granular control
router.patch('/header', ...isEditor, uploadFields, ctrl.updateHeaderLogo);
router.patch('/footer', ...isEditor, uploadFields, ctrl.updateFooterLogo);

export default router;
