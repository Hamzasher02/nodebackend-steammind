import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { getAllActivityTypes } from '../controller/activitytype.controller.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';

const router = express.Router();

router.route('/getAllActivityTypes').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("activity log", "read"),
    activityLogger("READ", "Get all activity types"),
    getAllActivityTypes
);

export default router;
