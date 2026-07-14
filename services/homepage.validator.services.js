import { body, param } from 'express-validator';

const updateHeroValidator = () => [
    body('title')
        .optional({ checkFalsy: true })
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters')
        .trim(),
    body('subtitle')
        .optional({ checkFalsy: true })
        .isLength({ max: 500 }).withMessage('Subtitle cannot exceed 500 characters')
        .trim()
];

const eventValidator = () => [
    body('name')
        .notEmpty().withMessage('Event name is required')
        .isLength({ min: 2, max: 150 }).withMessage('Event name must be 2-150 characters')
        .trim(),
    body('location')
        .notEmpty().withMessage('Event location is required')
        .isLength({ min: 2, max: 150 }).withMessage('Event location must be 2-150 characters')
        .trim(),
    body('year')
        .notEmpty().withMessage('Event year is required')
        .isLength({ min: 2, max: 30 }).withMessage('Event year must be a valid format')
        .trim()
];

const updateAboutUsValidator = () => [
    body('description')
        .notEmpty().withMessage('About Us description is required')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
        .trim()
];

const brandCardValidator = () => [
    body('heading')
        .notEmpty().withMessage('Brand feature heading is required')
        .isLength({ min: 2, max: 150 }).withMessage('Heading must be 2-150 characters')
        .trim(),
    body('paragraphs')
        .optional()
        .custom((value) => {
            // Handle parsing if it is sent as stringified JSON array
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) throw new Error();
                } catch {
                    throw new Error('Paragraphs must be a valid array or JSON array');
                }
            } else if (!Array.isArray(value)) {
                throw new Error('Paragraphs must be an array of strings');
            }
            return true;
        })
];

export {
    updateHeroValidator,
    eventValidator,
    updateAboutUsValidator,
    brandCardValidator
};
