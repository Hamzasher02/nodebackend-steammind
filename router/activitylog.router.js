import activityLogger from '../middleware/activitylogger.middleware.js';
import { getAllActivityLogs, getSingleActivityLog } from '../controller/activitylog.controller.js';
import express from 'express'
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';

const router = express.Router();

router.route('/getAllActivityLogs').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("activity log", "read"),
    activityLogger("READ", "Get all activity logs"),
    getAllActivityLogs
);

router.route('/getSingleActivityLog/').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("activity log", "read"),
    activityLogger("READ", "Get single activity log"),
    getSingleActivityLog
);

export default router;