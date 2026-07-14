import express from 'express';
import {
    createCourseModule,
    deleteCourseModule,
    deleteCourseModulePermanently,
    getAllCourseModule,
    getAllCourseModuleUserSide,
    getSingleCourseModule,
    getSingleCourseModuleUserSide,
    restoreCourseModule,
    updateCourseModule,
    updateIndexOfCourseModule
} from '../controller/coursemodule.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import {
    createCourseModuleValidator,
    deleteCourseModuleValidator,
    updateCourseModuleValidator
} from '../services/coursemodule.validator.services.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';

const router = express.Router();

router.post(
    '/createCourseModule',
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "write"),
    createCourseModuleValidator(),
    validationMiddleware,
    activityLogger("COURSE_MODULE", "Create course module request"),
    createCourseModule
);

router.patch(
    '/updateCourseModule/:courseId/:courseModuleId',
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "update"),
    updateCourseModuleValidator(),
    validationMiddleware,
    activityLogger("COURSE_MODULE", "Update course module request"),
    updateCourseModule
);


router.patch(
    '/updateCourseModuleIndex/:courseId',
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "update"),
    activityLogger("COURSE_MODULE", "Update course module index request"),
    updateIndexOfCourseModule
);

router.get(
    '/getCourseModules/:courseId',
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    activityLogger("COURSE_MODULE", "Get all course modules request"),
    getAllCourseModule
);
router.get(
    '/getAllCourseModuleUserSide/:courseId',
    authenticationMiddleware,
    activityLogger("COURSE_MODULE", "Get all course modules request"),
    getAllCourseModuleUserSide
);

router.get(
    '/getCourseModules/:courseId/:courseModuleId',
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    activityLogger("COURSE_MODULE", "Get single course module request"),
    getSingleCourseModule
);
router.get(
    '/getSingleCourseModuleUserSide/:courseId/:courseModuleId',
    authenticationMiddleware,
    activityLogger("COURSE_MODULE", "Get single course module request"),
    getSingleCourseModuleUserSide
);
router.patch(
    '/deleteCourseModule',
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "delete"),
    activityLogger("COURSE_MODULE", "Delete course module request"),
    deleteCourseModule
);
router.patch(
    '/restoreCourseModule',
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "update"),
    //here create vaidators and add

    activityLogger("COURSE_MODULE", "Delete course module request"),
    restoreCourseModule
);
router.delete(
    '/deleteCourseModulePermanently/:courseModuleId',
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "delete"),
    deleteCourseModuleValidator(),
    validationMiddleware, activityLogger("COURSE_MODULE", "Delete course module request"),
    deleteCourseModulePermanently
);
export default router;
