import { body } from 'express-validator';

const updateSection1Validator = () => [
    body('heading')
        .optional({ checkFalsy: true })
        .isLength({ max: 200 }).withMessage('Heading cannot exceed 200 characters')
        .trim(),
    body('subHeading')
        .optional({ checkFalsy: true })
        .isLength({ max: 1000 }).withMessage('Sub-heading cannot exceed 1000 characters')
        .trim()
];

const courseValidator = () => [
    body('title')
        .notEmpty().withMessage('Course title is required')
        .isLength({ min: 2, max: 150 }).withMessage('Title must be 2-150 characters')
        .trim(),
    body('description')
        .notEmpty().withMessage('Course description is required')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
        .trim(),
    body('ageGroup')
        .notEmpty().withMessage('Age group is required')
        .isLength({ max: 100 }).withMessage('Age group cannot exceed 100 characters')
        .trim(),
    body('duration')
        .notEmpty().withMessage('Duration is required')
        .isLength({ max: 100 }).withMessage('Duration cannot exceed 100 characters')
        .trim(),
    body('lessons')
        .notEmpty().withMessage('Lessons description is required')
        .isLength({ max: 200 }).withMessage('Lessons cannot exceed 200 characters')
        .trim(),
    body('activities')
        .notEmpty().withMessage('Activities description is required')
        .trim()
];

export {
    updateSection1Validator,
    courseValidator
};
