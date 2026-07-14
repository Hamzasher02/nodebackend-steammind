import { body, param } from 'express-validator';

const createChatValidator = () => [
    body('recipientId')
        .notEmpty().withMessage('Recipient ID is required')
        .isMongoId().withMessage('Invalid Recipient ID format')
];

const sendMessageValidator = () => [
    body('messageText')
        .optional()
        .trim()
];

const editMessageValidator = () => [
    body('messageText')
        .notEmpty().withMessage('Message text is required')
        .trim()
];

const flagMessageValidator = () => [
    body('reason')
        .notEmpty().withMessage('Flag reason is required')
        .trim()
];

const adminUpdateDocumentValidator = () => [
    body('originalName')
        .notEmpty().withMessage('Original document name is required')
        .trim()
];

export {
    createChatValidator,
    sendMessageValidator,
    editMessageValidator,
    flagMessageValidator,
    adminUpdateDocumentValidator
};
