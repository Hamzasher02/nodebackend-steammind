import { body } from 'express-validator';

const updateProductsHeroValidator = () => [
    body('heading')
        .optional({ checkFalsy: true })
        .isLength({ max: 200 }).withMessage('Heading cannot exceed 200 characters')
        .trim(),
    body('subHeading')
        .optional({ checkFalsy: true })
        .isLength({ max: 1000 }).withMessage('Sub-heading cannot exceed 1000 characters')
        .trim()
];

const productSectionValidator = () => [
    body('heading')
        .notEmpty().withMessage('Section heading is required')
        .isLength({ min: 2, max: 200 }).withMessage('Heading must be 2-200 characters')
        .trim(),
    body('description')
        .notEmpty().withMessage('Section description is required')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
        .trim(),
    body('blocks')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) throw new Error();
                } catch {
                    throw new Error('Blocks must be a valid JSON array of block objects');
                }
            } else if (!Array.isArray(value)) {
                throw new Error('Blocks must be an array of block objects');
            }
            return true;
        })
];

export {
    updateProductsHeroValidator,
    productSectionValidator
};
