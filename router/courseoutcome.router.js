import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    createCourseLearningOutcome,
    deleteCourseLearningOutcome,
    deleteCourseLearningOutcomePermanently,
    getAllCourseLearningOutcome,
    restoreCourseLearningOutcome,
    updateCourseLearningOutcome
} from '../controller/learningoutcome.controller.js';
import {
    createCourseLearningOutcomeValidator,
    getAllCourseLearningOutcomeValidator,
    updateCourseLearningOutcomeValidator
} from '../services/learningoutcome.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';

const router = express.Router();

router.post(
    '/createCourseLearningOutcome',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'write'),
    createCourseLearningOutcomeValidator(),
    validationMiddleware,
    activityLogger("LEARNING_OUTCOME", "Create course learning outcome request"),
    createCourseLearningOutcome
);

router.patch(
    '/updateCourseLearningOutcome',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'update'),
    updateCourseLearningOutcomeValidator(),
    validationMiddleware,
    activityLogger("LEARNING_OUTCOME", "Update course learning outcome request"),
    updateCourseLearningOutcome
);

router.get(
    '/getAllCourseLearningOutcome/:courseId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'read'),
    getAllCourseLearningOutcomeValidator(),
    validationMiddleware,
    activityLogger("LEARNING_OUTCOME", "Get all course learning outcomes request"),
    getAllCourseLearningOutcome
);

router.patch(
    '/deleteCourseLearningOutcome',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'delete'),
    activityLogger("LEARNING_OUTCOME", "Delete course learning outcome request"),
    deleteCourseLearningOutcome
);
router.patch(
    '/restoreCourseLearningOutcome/:courseOutcomeId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'update'),
    activityLogger("LEARNING_OUTCOME", "Delete course learning outcome request"),
    restoreCourseLearningOutcome
);
router.delete(
    '/deleteCourseLearningOutcomePermanently/:courseOutcomeId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'delete'),
    activityLogger("LEARNING_OUTCOME", "Delete course learning outcome request"),
    deleteCourseLearningOutcomePermanently
);

export default router;
