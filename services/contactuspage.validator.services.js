import { body } from 'express-validator';

const contactSection1Validator = () => [
    body('heading')
        .optional({ checkFalsy: true })
        .isLength({ max: 250 }).withMessage('Heading cannot exceed 250 characters')
        .trim(),
    body('paragraph')
        .optional({ checkFalsy: true })
        .isLength({ max: 1000 }).withMessage('Paragraph cannot exceed 1000 characters')
        .trim(),
    body('heading2')
        .optional({ checkFalsy: true })
        .isLength({ max: 250 }).withMessage('Heading 2 cannot exceed 250 characters')
        .trim(),
    body('paragraph2')
        .optional({ checkFalsy: true })
        .isLength({ max: 1000 }).withMessage('Paragraph 2 cannot exceed 1000 characters')
        .trim()
];

const locationValidator = () => [
    body('location')
        .notEmpty().withMessage('Location address is required')
        .isLength({ min: 5, max: 300 }).withMessage('Location address must be 5-300 characters')
        .trim()
];

export {
    contactSection1Validator,
    locationValidator
};
