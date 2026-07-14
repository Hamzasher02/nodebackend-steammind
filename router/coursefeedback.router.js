import express from 'express';
import {
    createCourseFeedback,
    getCourseFeedbacks,
    getSingleFeedback,
    getUserCourseFeedback,
    updateCourseFeedback,
    deleteCourseFeedback,
    getAllFeedbacks,
    getInstructorWiseAllCourseFeedback
} from '../controller/coursefeedback.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import {
    createCourseFeedbackValidator,
    getCourseFeedbacksValidator,
    getSingleFeedbackValidator,
    getUserCourseFeedbackValidator,
    updateCourseFeedbackValidator,
    deleteCourseFeedbackValidator,
    getAllFeedbacksValidator
} from '../services/coursefeedback.validator.services.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';

const router = express.Router();

// User routes - Create feedback
router.post(
    '/createFeedback/:courseId',
    createCourseFeedbackValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("COURSE_FEEDBACK", "Create course feedback request"),
    createCourseFeedback
);

// User routes - Get user's own feedback for a course
router.get(
    '/getUserCourseFeedback/:courseId',
    getUserCourseFeedbackValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("COURSE_FEEDBACK", "Get user course feedback request"),
    getUserCourseFeedback
);

// User routes - Update own feedback
router.patch(
    '/updateFeedback/:feedbackId',
    updateCourseFeedbackValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("COURSE_FEEDBACK", "Update course feedback request"),
    updateCourseFeedback
);

// User routes - Delete own feedback
router.delete(
    '/deleteFeedback/:feedbackId',
    deleteCourseFeedbackValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger("COURSE_FEEDBACK", "Delete course feedback request"),
    deleteCourseFeedback
);

// Public/User routes - Get all feedbacks for a course
router.get(
    '/getCourseFeedbacks/:courseId',
    getCourseFeedbacksValidator(),
    validationMiddleware,
    activityLogger("COURSE_FEEDBACK", "Get course feedbacks request"),
    getCourseFeedbacks
);

// Public/User routes - Get single feedback
router.get(
    '/getSingleFeedback/:feedbackId',
    getSingleFeedbackValidator(),
    validationMiddleware,
    activityLogger("COURSE_FEEDBACK", "Get single feedback request"),
    getSingleFeedback
);

// Admin routes - Get all feedbacks
router.get(
    '/admin/getAllFeedbacks',
    getAllFeedbacksValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware("admin"),
    activityLogger("COURSE_FEEDBACK", "Get all feedbacks (admin) request"),
    getAllFeedbacks
);
/// i dont think so above api  is going to work fix later
router.get(
    '/getInstructorWiseAllCourseFeedback',
   
    authenticationMiddleware,
    roleAuthorizationMiddleware("instructor"),
    activityLogger("COURSE_FEEDBACK", "Get all feedbacks (admin) request"),
    getInstructorWiseAllCourseFeedback
);

export default router;
