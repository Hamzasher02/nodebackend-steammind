import { body, param, query } from "express-validator";

const createQuizValidator = () => [
    body('title')
        .trim()
        .notEmpty().withMessage('Quiz title is required')
        .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    
    body('course')
        .notEmpty().withMessage('Course ID is required')
        .isMongoId().withMessage('Invalid course ID format'),
    
    body('module')
        .optional()
        .isMongoId().withMessage('Invalid module ID format'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    
    body('category')
        .optional()
        .isIn(['Assessment', 'Practice', 'Placement', 'Pre-Assessment'])
        .withMessage('Invalid category')
];

const updateQuizInfoValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format'),
    
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    
    body('category')
        .optional()
        .isIn(['Assessment', 'Practice', 'Placement', 'Pre-Assessment'])
        .withMessage('Invalid category'),
    
    body('module')
        .optional()
        .isMongoId().withMessage('Invalid module ID format')
];

const addQuestionValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format'),
    
    body('type')
        .notEmpty().withMessage('Question type is required')
        .isIn(['multipleChoice', 'trueFalse', 'shortAnswer'])
        .withMessage('Type must be multipleChoice, trueFalse, or shortAnswer'),
    
    body('prompt')
        .trim()
        .notEmpty().withMessage('Question prompt is required')
        .isLength({ min: 5 }).withMessage('Prompt must be at least 5 characters'),
    
    body('options')
        .optional()
        .isArray().withMessage('Options must be an array'),
    
    body('correctAnswers')
        .optional()
        .isArray().withMessage('Correct answers must be an array'),
    
    body('points')
        .notEmpty().withMessage('Points are required')
        .isInt({ min: 1, max: 1000 }).withMessage('Points must be between 1 and 1000'),
    
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
    
    body('explanation')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Explanation must not exceed 1000 characters'),
    
    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),
    
    body('source')
        .optional()
        .trim()
];

const updateQuestionValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format'),
    
    param('questionId')
        .notEmpty().withMessage('Question ID is required')
        .isMongoId().withMessage('Invalid question ID format'),
    
    body('type')
        .optional()
        .isIn(['multipleChoice', 'trueFalse', 'shortAnswer'])
        .withMessage('Type must be multipleChoice, trueFalse, or shortAnswer'),
    
    body('prompt')
        .optional()
        .trim()
        .isLength({ min: 5 }).withMessage('Prompt must be at least 5 characters'),
    
    body('points')
        .optional()
        .isInt({ min: 1, max: 1000 }).withMessage('Points must be between 1 and 1000'),
    
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level')
];

const questionIdValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format'),
    
    param('questionId')
        .notEmpty().withMessage('Question ID is required')
        .isMongoId().withMessage('Invalid question ID format')
];

const reorderQuestionsValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format'),
    
    body('orders')
        .isArray().withMessage('Orders must be an array')
        .notEmpty().withMessage('Orders array is required')
];

const updateSettingsValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format'),
    
    body('timeLimitMinutes')
        .optional()
        .isInt({ min: 0 }).withMessage('Time limit must be 0 or greater'),
    
    body('attemptsAllowed')
        .optional()
        .isInt({ min: 1 }).withMessage('Attempts allowed must be at least 1'),
    
    body('passingScorePercent')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100'),
    
    body('randomizeQuestions')
        .optional()
        .isBoolean().withMessage('randomizeQuestions must be boolean'),
    
    body('allowBackNavigation')
        .optional()
        .isBoolean().withMessage('allowBackNavigation must be boolean'),
    
    body('showProgressBar')
        .optional()
        .isBoolean().withMessage('showProgressBar must be boolean'),
    
    body('showResults')
        .optional()
        .isIn(['immediately', 'later']).withMessage('showResults must be "immediately" or "later"')
];

const setStatusValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format'),
    
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['draft', 'published', 'scheduled']).withMessage('Status must be draft, published, or scheduled'),
    
    body('publishAt')
        .if(body('status').equals('scheduled'))
        .notEmpty().withMessage('publishAt is required for scheduled status')
        .isISO8601().withMessage('publishAt must be a valid ISO8601 date')
];

const getQuizByIdValidator = () => [
    param('quizId')
        .notEmpty().withMessage('Quiz ID is required')
        .isMongoId().withMessage('Invalid quiz ID format')
];

const listMyQuizzesValidator = () => [
    query('status')
        .optional()
        .isIn(['draft', 'published', 'scheduled']).withMessage('Status must be draft, published, or scheduled'),
    
    query('courseId')
        .optional()
        .isMongoId().withMessage('Invalid course ID format'),
    
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be at least 1'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export {
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
};
