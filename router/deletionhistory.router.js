import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { getAllDeletionHistory } from '../controller/deletehistory.controller.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';

const router = express.Router();

router.route('/getAllDeletionHistory')
    .get(
        authenticationMiddleware,
        routeAuthorizationMiddleware('deletion history', 'read'),
        activityLogger("DELETION_HISTORY", "Get all deletion history request"),
        getAllDeletionHistory
    );

export default router;
