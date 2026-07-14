import express from 'express';
import {
    getAvailableQuizzes,
    startQuizAttempt,
    submitQuiz,
    getQuizResults,
    getQuizAttempts
} from '../controller/studentquiz.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import {
    getAvailableQuizzesValidator,
    startQuizAttemptValidator,
    submitQuizValidator,
    getQuizResultsValidator,
    getQuizAttemptsValidator
} from '../services/studentquiz.validator.services.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';

const router = express.Router();

// Get available quizzes for student's enrolled courses
router.get(
    '/getAvailableQuizzes',
    getAvailableQuizzesValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger('STUDENT_QUIZ', 'View available quizzes'),
    getAvailableQuizzes
);

// Start quiz attempt
router.post(
    '/startAttempt/:quizId',
    startQuizAttemptValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger('STUDENT_QUIZ', 'Start quiz attempt'),
    startQuizAttempt
);

// Submit quiz with all answers at once
router.post(
    '/submitQuiz/:attemptId',
    submitQuizValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger('STUDENT_QUIZ', 'Submit quiz'),
    submitQuiz
);

// Get quiz results
router.get(
    '/getResults/:attemptId',
    getQuizResultsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger('STUDENT_QUIZ', 'View results'),
    getQuizResults
);

// Get quiz attempt history
router.get(
    '/getAttempts',
    getQuizAttemptsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger('STUDENT_QUIZ', 'View attempts'),
    getQuizAttempts
);

export default router;
