import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import { uploadCompetitionThumbnail } from '../middleware/competition.multer.middleware.js';
import {
    getAllCompetitions,
    getSingleCompetition,
    createCompetition,
    updateCompetition,
    deleteCompetition
} from '../controller/competition.controller.js';
import {
    createCompetitionValidator,
    updateCompetitionValidator
} from '../services/competition.validator.services.js';

const router = express.Router();

// 1. Get All Competitions / Create Competition
router.route('/')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get all competitions request'),
        getAllCompetitions
    )
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadCompetitionThumbnail,
        createCompetitionValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Create competition request'),
        createCompetition
    );

// 2. Get Single / Update / Delete Competition
router.route('/:competitionId')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get single competition request'),
        getSingleCompetition
    )
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadCompetitionThumbnail,
        updateCompetitionValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update competition request'),
        updateCompetition
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete competition request'),
        deleteCompetition
    );

export default router;
