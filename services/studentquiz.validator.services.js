import { param, body, query } from "express-validator";

const getAvailableQuizzesValidator = () => [
    query('courseId')
        .optional()
        .isMongoId().withMessage('Invalid course ID format'),
    
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be at least 1'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

const startQuizAttemptValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format')
];

const submitQuizValidator = () => [
    param('attemptId')
        .notEmpty().withMessage('Attempt ID is required')
        .isMongoId().withMessage('Invalid attempt ID format'),
    
    body('answers')
        .notEmpty().withMessage('Answers array is required')
        .isArray().withMessage('Answers must be an array')
        .custom(answers => {
            if (!Array.isArray(answers) || answers.length === 0) {
                throw new Error('Answers array cannot be empty');
            }
            answers.forEach(answer => {
                if (!answer.questionId) {
                    throw new Error('Each answer must have a questionId');
                }
            });
            return true;
        })
];

const getQuizResultsValidator = () => [
    param('attemptId')
        .notEmpty().withMessage('Attempt ID is required')
        .isMongoId().withMessage('Invalid attempt ID format')
];

const getQuizAttemptsValidator = () => [
    query('quizId')
        .optional()
        .isMongoId().withMessage('Invalid quiz ID format'),
    
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be at least 1'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

export {
    getAvailableQuizzesValidator,
    startQuizAttemptValidator,
    submitQuizValidator,
    getQuizResultsValidator,
    getQuizAttemptsValidator
};
