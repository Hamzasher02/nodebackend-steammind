import express from 'express';
import {
    createQuiz,
    updateQuizInfo,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    updateSettings,
    setStatus,
    getQuizById,
    listMyQuizzes,
    getQuizSummary,
    getInstructorDashboard
} from '../controller/quiz.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import {
    createQuizValidator,
    updateQuizInfoValidator,
    addQuestionValidator,
    updateQuestionValidator,
    questionIdValidator,
    reorderQuestionsValidator,
    updateSettingsValidator,
    setStatusValidator,
    getQuizByIdValidator,
    listMyQuizzesValidator
} from '../services/quiz.validator.services.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';

const router = express.Router();

// Create quiz
router.post(
    '/createQuiz',
    createQuizValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'Create quiz'),
    createQuiz
);

// Get my quizzes
router.get(
    '/getMyQuizzes',
    listMyQuizzesValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'List quizzes'),
    listMyQuizzes
);

// Get instructor dashboard
router.get(
    '/dashboard',
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'View dashboard'),
    getInstructorDashboard
);

// Get quiz by ID (with questions)
router.get(
    '/getQuiz/:quizId',
    getQuizByIdValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger('QUIZ', 'View quiz'),
    getQuizById
);

// Get quiz summary
router.get(
    '/getSummary/:quizId',
    getQuizByIdValidator(),
    validationMiddleware,
    authenticationMiddleware,
    activityLogger('QUIZ', 'View summary'),
    getQuizSummary
);

// Update quiz info
router.patch(
    '/updateInfo/:quizId',
    updateQuizInfoValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'Update quiz info'),
    updateQuizInfo
);

// Add question
router.post(
    '/addQuestion/:quizId',
    addQuestionValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'Add question'),
    addQuestion
);

// Update question
router.patch(
    '/updateQuestion/:quizId/:questionId',
    updateQuestionValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'Update question'),
    updateQuestion
);

// Delete question (soft delete)
router.delete(
    '/deleteQuestion/:quizId/:questionId',
    questionIdValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'Delete question'),
    deleteQuestion
);

// Reorder questions
router.patch(
    '/reorderQuestions/:quizId',
    reorderQuestionsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'Reorder questions'),
    reorderQuestions
);

// Update settings
router.patch(
    '/updateSettings/:quizId',
    updateSettingsValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'Update settings'),
    updateSettings
);

// Set status (publish/schedule)
router.patch(
    '/setStatus/:quizId',
    setStatusValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('instructor'),
    activityLogger('QUIZ', 'Change status'),
    setStatus
);

export default router;
