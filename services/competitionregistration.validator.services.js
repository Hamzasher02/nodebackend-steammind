import { body } from 'express-validator';

const createRegistrationValidator = () => [
    body('competitionId')
        .notEmpty().withMessage('competitionId is required')
        .isMongoId().withMessage('Invalid competitionId format'),
    body('studentName')
        .notEmpty().withMessage('studentName is required')
        .trim(),
    body('grade')
        .notEmpty().withMessage('grade is required')
        .trim(),
    body('teamName')
        .notEmpty().withMessage('teamName is required')
        .trim(),
    body('teamSize')
        .notEmpty().withMessage('teamSize is required')
        .isInt({ min: 1 }).withMessage('teamSize must be a positive integer')
];

const updateRegistrationStatusValidator = () => [
    body('status')
        .notEmpty().withMessage('status is required')
        .isIn(['confirmed', 'pending', 'canceled']).withMessage('Status must be "confirmed", "pending", or "canceled"')
];

export {
    createRegistrationValidator,
    updateRegistrationStatusValidator
};
