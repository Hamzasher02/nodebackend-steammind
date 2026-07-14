import express from 'express';
import {
    createEnrollment,
    getUserEnrollments,
    getSingleEnrollment,
    checkEnrollmentStatus,
    getAllEnrollments,
    getPendingEnrollments,
    getEnrolledCourseData,
    getModuleDetails,
    getLectureDetail,
    getPdfDetail,
    updateEnrollmentStatus
} from '../controller/enrollment.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import {
    createEnrollmentValidator,
    getEnrollmentValidator,
    getUserEnrollmentsValidator,
    getCourseEnrollmentsValidator,
    approveEnrollmentValidator,
    rejectEnrollmentValidator,
    getEnrolledCourseDataValidator,
    getModuleDetailsValidator,
    getLectureDetailValidator,
    getPdfDetailValidator
} from '../services/enrollment.validator.services.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { singlePaymentScreenshot } from '../middleware/multer.middleware.js';

const router = express.Router();

router.post(
    '/createEnrollment/:courseId',
    singlePaymentScreenshot,
    createEnrollmentValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware("student"),
    activityLogger("ENROLLMENT", "Create enrollment request"),
    createEnrollment
);

router.get(
    '/getUserEnrollments',
    getUserEnrollmentsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("ENROLLMENT", "Get user enrollments request"),
    getUserEnrollments
);

router.get(
    '/getSingleEnrollment/:enrollmentId',
    getEnrollmentValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("ENROLLMENT", "Get single enrollment request"),
    getSingleEnrollment
);

router.get(
    '/checkEnrollmentStatus/:courseId',
    getCourseEnrollmentsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("ENROLLMENT", "Check enrollment status request"),
    checkEnrollmentStatus
);

router.get(
    '/getEnrolledCourseData/:courseId',
    getEnrolledCourseDataValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("ENROLLMENT", "Get enrolled course data request"),
    getEnrolledCourseData
);

// Admin Routes
router.get(
    '/admin/getAllEnrollments',
    authenticationMiddleware,
    roleAuthorizationMiddleware("admin"),
    activityLogger("ENROLLMENT", "Get all enrollments (admin) request"),
    getAllEnrollments
);

router.get(
    '/admin/getPendingEnrollments',
    authenticationMiddleware,
    roleAuthorizationMiddleware("admin"),
    activityLogger("ENROLLMENT", "Get pending enrollments (admin) request"),
    getPendingEnrollments
);

router.patch(
    '/admin/updateEnrollmentStatus/:enrollmentId',
    approveEnrollmentValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware("admin"),
    activityLogger("ENROLLMENT", "Approve enrollment (admin) request"),
    updateEnrollmentStatus
);



// Student Routes - Module, Lecture, PDF Details
router.get(
    '/:enrollmentId/modules/:moduleId',
    getModuleDetailsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware("student"),
    activityLogger("ENROLLMENT", "Get module details request"),
    getModuleDetails
);

router.get(
    '/:enrollmentId/modules/:moduleId/lectures/:lectureId',
    getLectureDetailValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware("student"),
    activityLogger("ENROLLMENT", "Get lecture detail request"),
    getLectureDetail
);

router.get(
    '/:enrollmentId/modules/:moduleId/pdfs/:pdfId',
    getPdfDetailValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware("student"),
    activityLogger("ENROLLMENT", "Get PDF detail request"),
    getPdfDetail
);

export default router;
