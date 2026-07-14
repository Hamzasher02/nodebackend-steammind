import { body } from 'express-validator';

const campSection1Validator = () => [
    body('heading')
        .optional({ checkFalsy: true })
        .isLength({ max: 250 }).withMessage('Heading cannot exceed 250 characters')
        .trim(),
    body('paragraphs')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) throw new Error();
                } catch {
                    throw new Error('Paragraphs must be a valid JSON array');
                }
            } else if (!Array.isArray(value)) {
                throw new Error('Paragraphs must be an array of strings');
            }
            return true;
        })
];

const campDetailValidator = () => [
    body('label')
        .notEmpty().withMessage('Detail label is required')
        .isLength({ min: 2, max: 150 }).withMessage('Label must be 2-150 characters')
        .trim(),
    body('value')
        .notEmpty().withMessage('Detail value is required')
        .isLength({ min: 1, max: 150 }).withMessage('Value must be 1-150 characters')
        .trim()
];

const advantageValidator = () => [
    body('title')
        .notEmpty().withMessage('Advantage title is required')
        .isLength({ min: 2, max: 150 }).withMessage('Title must be 2-150 characters')
        .trim(),
    body('description')
        .notEmpty().withMessage('Advantage description is required')
        .isLength({ min: 5 }).withMessage('Description must be at least 5 characters')
        .trim()
];

export {
    campSection1Validator,
    campDetailValidator,
    advantageValidator
};
