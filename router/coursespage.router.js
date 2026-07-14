import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    uploadSection1Image,
    uploadCourseThumbnail
} from '../middleware/coursespage.multer.middleware.js';
import {
    getCoursesPage,
    updateSection1,
    addCourse,
    updateCourse,
    deleteCourse
} from '../controller/coursespage.controller.js';
import {
    updateSection1Validator,
    courseValidator
} from '../services/coursespage.validator.services.js';

const router = express.Router();

// 1. Get Courses Page Content (Public)
router.route('/')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get courses page content request'),
        getCoursesPage
    );

// 2. Update Section 1
router.route('/section1')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadSection1Image,
        updateSection1Validator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update courses page section 1 request'),
        updateSection1
    );

// 3. Add Promotional Course
router.route('/courses')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadCourseThumbnail,
        courseValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add promotional course request'),
        addCourse
    );

// 4. Update Course / Delete Course
router.route('/courses/:courseId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadCourseThumbnail,
        courseValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update promotional course request'),
        updateCourse
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete promotional course request'),
        deleteCourse
    );

export default router;
