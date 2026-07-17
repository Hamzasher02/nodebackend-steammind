import { body, param } from 'express-validator';

const createChatValidator = () => [
    body('recipientId')
        .notEmpty().withMessage('Recipient ID is required')
        .isMongoId().withMessage('Invalid Recipient ID format')
];

const sendMessageValidator = () => [
    body('messageText')
        .trim()
        .custom((value, { req }) => {
            const text = typeof value === 'string' ? value.trim() : '';
            const hasFile = !!(req.file || (req.files && (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length)));
            if (!text && !hasFile) {
                throw new Error('Message must contain at least message text or an uploaded file');
            }
            return true;
        })
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
