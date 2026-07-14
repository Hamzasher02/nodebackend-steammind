import express from 'express';
import {
    createCourseSession,
    getAllCourseSessions,
    getCourseSessionsByCourse,
    getSessionsByEnrollment,
    getInstructorSessions,
    getStudentSessions,
    getSingleSession,
    updateCourseSession,
    deleteCourseSession,
    getSessionsCountByCourse,
    getStudentSessionsByEnrollment,
    markModuleComplete,
    getSessionDetailWithModules,
    getInstructorStudentsByCourse
} from '../controller/coursesession.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import {
    createCourseSessionValidator,
    getSingleSessionValidator,
    getSessionsByEnrollmentValidator,
    getCourseSessionsByCourseValidator,
    getSessionsCountByCourseValidator,
    updateCourseSessionValidator,
    deleteCourseSessionValidator,
    getAllCourseSessionsValidator,
    getStudentSessionsValidator,
    getInstructorSessionsValidator,
    getStudentSessionsByEnrollmentValidator,
    markModuleCompleteValidator,
    getSessionDetailWithModulesValidator
} from '../services/coursesession.validator.services.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';

const router = express.Router();

// Admin Routes
router.post(
    '/createSession',
    createCourseSessionValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin'),
    activityLogger("COURSE_SESSION", "Create course session"),
    createCourseSession
);

router.get(
    '/allSessions',
    getAllCourseSessionsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin'),
    activityLogger("COURSE_SESSION", "Get all sessions"),
    getAllCourseSessions
);

router.get(
    '/course/:courseId/sessions',
    getCourseSessionsByCourseValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin'),
    activityLogger("COURSE_SESSION", "Get course sessions"),
    getCourseSessionsByCourse
);

router.get(
    '/course/:courseId/sessionsCount',
    getSessionsCountByCourseValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin'),
    activityLogger("COURSE_SESSION", "Get sessions count"),
    getSessionsCountByCourse
);

router.get(
    '/:sessionId',
    getSingleSessionValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("COURSE_SESSION", "View session"),
    getSingleSession
);

router.patch(
    '/:sessionId/update',
    updateCourseSessionValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin'),
    activityLogger("COURSE_SESSION", "Update session"),
    updateCourseSession
);

router.delete(
    '/:sessionId/delete',
    deleteCourseSessionValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin'),
    activityLogger("COURSE_SESSION", "Delete session"),
    deleteCourseSession
);

// Enrollment specific routes
router.get(
    '/enrollment/:enrollmentId/sessions',
    getSessionsByEnrollmentValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("COURSE_SESSION", "Get enrollment sessions"),
    getSessionsByEnrollment
);

// Instructor Routes
router.get(
    '/instructor/my-sessions',
    getInstructorSessionsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger("COURSE_SESSION", "Instructor view sessions"),
    getInstructorSessions
);

// Student Routes
router.get(
    '/student/my-sessions',
    getStudentSessionsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger("COURSE_SESSION", "Student view sessions"),
    getStudentSessions
);

router.get(
    '/student/enrollment/:enrollmentId/sessions',
    getStudentSessionsByEnrollmentValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger("COURSE_SESSION", "Student view enrollment sessions"),
    getStudentSessionsByEnrollment
);

// Instructor Routes - Module Management
router.get(
    '/instructor/:sessionId/modules-detail',
    getSessionDetailWithModulesValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger("COURSE_SESSION", "Instructor view session with modules"),
    getSessionDetailWithModules
);
router.get(
    '/instructor/:courseId/students',
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger("COURSE_SESSION", "Instructor view session with modules"),
    getInstructorStudentsByCourse
);

router.patch(
    '/instructor/:sessionId/modules/:moduleId/mark-complete',
    markModuleCompleteValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger("COURSE_SESSION", "Instructor mark module complete"),
    markModuleComplete
);

export default router;
