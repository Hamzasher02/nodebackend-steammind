import { body } from 'express-validator';

const createBlogValidator = () => [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 250 }).withMessage('Title cannot exceed 250 characters')
        .trim(),
    body('urlSlug')
        .notEmpty().withMessage('URL Slug is required')
        .matches(/^[a-z0-9-_]+$/).withMessage('Slug must contain only lowercase letters, numbers, hyphens, and underscores')
        .trim(),
    body('authorName')
        .notEmpty().withMessage('Author Name is required')
        .trim(),
    body('category')
        .notEmpty().withMessage('Category is required')
        .trim(),
    body('tags')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                // Allows comma separated tags or JSON array string
                return true;
            }
            if (Array.isArray(value)) {
                return true;
            }
            throw new Error('Tags must be a comma-separated string or an array');
        }),
    body('status')
        .optional()
        .isIn(['draft', 'published']).withMessage('Status must be either "draft" or "published"')
];

const updateBlogValidator = () => [
    body('title')
        .optional()
        .isLength({ max: 250 }).withMessage('Title cannot exceed 250 characters')
        .trim(),
    body('urlSlug')
        .optional()
        .matches(/^[a-z0-9-_]+$/).withMessage('Slug must contain only lowercase letters, numbers, hyphens, and underscores')
        .trim(),
    body('authorName')
        .optional()
        .trim(),
    body('category')
        .optional()
        .trim(),
    body('tags')
        .optional()
        .custom((value) => {
            if (typeof value === 'string' || Array.isArray(value)) {
                return true;
            }
            throw new Error('Tags must be a comma-separated string or an array');
        }),
    body('status')
        .optional()
        .isIn(['draft', 'published']).withMessage('Status must be either "draft" or "published"')
];

const blogCardValidator = () => [
    body('title')
        .notEmpty().withMessage('Card title is required')
        .isLength({ max: 200 }).withMessage('Card title cannot exceed 200 characters')
        .trim(),
    body('platform')
        .optional({ checkFalsy: true })
        .trim(),
    body('stemSkills')
        .optional()
        .custom((value) => {
            if (typeof value === 'string' || Array.isArray(value)) {
                return true;
            }
            throw new Error('STEM Skills must be a comma-separated string or an array');
        }),
    body('paragraph')
        .optional({ checkFalsy: true })
        .trim(),
    body('example')
        .optional({ checkFalsy: true })
        .trim(),
    body('learningOutcomes')
        .optional({ checkFalsy: true })
        .trim(),
    body('proTips')
        .optional({ checkFalsy: true })
        .trim()
];

export {
    createBlogValidator,
    updateBlogValidator,
    blogCardValidator
};
