import { body } from 'express-validator';
import { validateJsonArray } from '../utils/cleanup.helper.utils.js';

const introductionValidator = () => [
    body('paragraphs')
        .notEmpty().withMessage('Paragraphs are required')
        .custom(validateJsonArray('Paragraphs must be a valid JSON array', 'Paragraphs must be an array of strings'))
];

const platformValidator = () => [
    body('title')
        .notEmpty().withMessage('Platform title is required')
        .isLength({ min: 2, max: 150 }).withMessage('Title must be 2-150 characters')
        .trim(),
    body('paragraphs')
        .optional()
        .custom(validateJsonArray('Paragraphs must be a valid JSON array', 'Paragraphs must be an array of strings'))
];

const missionVisionValidator = () => [
    body('title')
        .notEmpty().withMessage('Section title is required')
        .isLength({ min: 2, max: 150 }).withMessage('Title must be 2-150 characters')
        .trim(),
    body('heading')
        .notEmpty().withMessage('Section heading is required')
        .isLength({ min: 2, max: 200 }).withMessage('Heading must be 2-200 characters')
        .trim(),
    body('paragraphs')
        .optional()
        .custom(validateJsonArray('Paragraphs must be a valid JSON array', 'Paragraphs must be an array of strings'))
];

const articleValidator = () => [
    body('heading')
        .notEmpty().withMessage('Article heading is required')
        .isLength({ min: 2, max: 200 }).withMessage('Heading must be 2-200 characters')
        .trim(),
    body('paragraphs')
        .optional()
        .custom(validateJsonArray('Paragraphs must be a valid JSON array', 'Paragraphs must be an array of strings'))
];

const strategicPartnershipValidator = () => [
    body('text')
        .optional({ checkFalsy: true })
        .isLength({ max: 500 }).withMessage('Text cannot exceed 500 characters')
        .trim()
];

const teamMemberValidator = () => [
    body('name')
        .notEmpty().withMessage('Team member name is required')
        .isLength({ min: 2, max: 150 }).withMessage('Name must be 2-150 characters')
        .trim(),
    body('designation')
        .notEmpty().withMessage('Team member designation is required')
        .isLength({ min: 2, max: 150 }).withMessage('Designation must be 2-150 characters')
        .trim()
];

export {
    introductionValidator,
    platformValidator,
    missionVisionValidator,
    articleValidator,
    strategicPartnershipValidator,
    teamMemberValidator
};
