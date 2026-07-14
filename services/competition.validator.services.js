import { body } from 'express-validator';

const createCompetitionValidator = () => [
    body('title')
        .notEmpty().withMessage('Competition title is required')
        .isLength({ max: 250 }).withMessage('Title cannot exceed 250 characters')
        .trim(),
    body('competitionType')
        .optional()
        .isIn(['official', 'practice']).withMessage('Competition type must be "official" or "practice"'),
    body('urlSlug')
        .notEmpty().withMessage('URL Slug is required')
        .matches(/^[a-z0-9-_]+$/).withMessage('Slug must contain only lowercase letters, numbers, hyphens, and underscores')
        .trim(),
    body('hostedBy')
        .optional()
        .trim(),
    body('shortDescription')
        .optional()
        .trim(),
    body('startDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Start date must be a valid date format (ISO 8601)'),
    body('endDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('End date must be a valid date format (ISO 8601)'),
    body('teamSize')
        .optional()
        .custom((value) => {
            let parsed = value;
            if (typeof value === 'string') {
                try {
                    parsed = JSON.parse(value);
                } catch {
                    throw new Error('teamSize must be a valid JSON object');
                }
            }
            if (parsed.min !== undefined && (isNaN(parsed.min) || parsed.min < 1)) {
                throw new Error('teamSize.min must be a number >= 1');
            }
            if (parsed.max !== undefined && (isNaN(parsed.max) || parsed.max < parsed.min)) {
                throw new Error('teamSize.max must be a number >= teamSize.min');
            }
            return true;
        }),
    body('gradeRange')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) throw new Error();
                } catch {
                    // Assume comma separated
                    return true;
                }
            } else if (!Array.isArray(value)) {
                throw new Error('gradeRange must be a comma-separated string or an array');
            }
            return true;
        }),
    body('maximumParticipants')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('Maximum participants must be a positive integer'),
    body('registrationStatus')
        .optional()
        .isIn(['open', 'closed']).withMessage('Registration status must be "open" or "closed"'),
    body('registrationFee')
        .optional()
        .isIn(['free', 'paid']).withMessage('Registration fee must be "free" or "paid"'),
    body('allowSaveInfo')
        .optional()
        .isBoolean().withMessage('allowSaveInfo must be a boolean'),
    body('status')
        .optional()
        .isIn(['draft', 'published']).withMessage('Status must be "draft" or "published"'),
    body('contentBlocks')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) throw new Error();
                } catch {
                    throw new Error('contentBlocks must be a valid JSON array');
                }
            } else if (!Array.isArray(value)) {
                throw new Error('contentBlocks must be an array');
            }
            return true;
        })
];

const updateCompetitionValidator = () => [
    body('title')
        .optional()
        .isLength({ max: 250 }).withMessage('Title cannot exceed 250 characters')
        .trim(),
    body('competitionType')
        .optional()
        .isIn(['official', 'practice']).withMessage('Competition type must be "official" or "practice"'),
    body('urlSlug')
        .optional()
        .matches(/^[a-z0-9-_]+$/).withMessage('Slug must contain only lowercase letters, numbers, hyphens, and underscores')
        .trim(),
    body('hostedBy')
        .optional()
        .trim(),
    body('shortDescription')
        .optional()
        .trim(),
    body('startDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Start date must be a valid date format (ISO 8601)'),
    body('endDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('End date must be a valid date format (ISO 8601)'),
    body('teamSize')
        .optional()
        .custom((value) => {
            let parsed = value;
            if (typeof value === 'string') {
                try {
                    parsed = JSON.parse(value);
                } catch {
                    throw new Error('teamSize must be a valid JSON object');
                }
            }
            if (parsed.min !== undefined && (isNaN(parsed.min) || parsed.min < 1)) {
                throw new Error('teamSize.min must be a number >= 1');
            }
            if (parsed.max !== undefined && (isNaN(parsed.max) || parsed.max < parsed.min)) {
                throw new Error('teamSize.max must be a number >= teamSize.min');
            }
            return true;
        }),
    body('gradeRange')
        .optional()
        .custom((value) => {
            if (typeof value === 'string' || Array.isArray(value)) {
                return true;
            }
            throw new Error('gradeRange must be a comma-separated string or an array');
        }),
    body('maximumParticipants')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('Maximum participants must be a positive integer'),
    body('registrationStatus')
        .optional()
        .isIn(['open', 'closed']).withMessage('Registration status must be "open" or "closed"'),
    body('registrationFee')
        .optional()
        .isIn(['free', 'paid']).withMessage('Registration fee must be "free" or "paid"'),
    body('allowSaveInfo')
        .optional()
        .isBoolean().withMessage('allowSaveInfo must be a boolean'),
    body('status')
        .optional()
        .isIn(['draft', 'published']).withMessage('Status must be "draft" or "published"'),
    body('contentBlocks')
        .optional()
        .custom((value) => {
            if (typeof value === 'string' || Array.isArray(value)) {
                return true;
            }
            throw new Error('contentBlocks must be an array or a JSON string representation of an array');
        })
];

export {
    createCompetitionValidator,
    updateCompetitionValidator
};
