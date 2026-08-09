import express from 'express';
import * as ctrl from '../controller/competition.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import multer from 'multer';

const router = express.Router();

const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } }).single('thumbnail');

const isEditor = [
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin', 'website manager')
];

// Public
router.get('/', ctrl.getAllCompetitions);
router.get('/:competitionId', ctrl.getSingleCompetition);

// Protected
router.post('/', ...isEditor, upload, ctrl.createCompetition);
router.patch('/:competitionId', ...isEditor, upload, ctrl.updateCompetition);
router.delete('/:competitionId', ...isEditor, ctrl.deleteCompetition);

export default router;
