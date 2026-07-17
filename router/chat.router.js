import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import { uploadChatDocument } from '../middleware/chat.multer.middleware.js';
import {
    createChat,
    getAllChats,
    getChatMessages,
    sendMessage,
    editOwnMessage,
    flagMessage,
    uploadDocument,
    getDocumentDetails
} from '../controller/chat.controller.js';
import {
    createChatValidator,
    sendMessageValidator,
    editMessageValidator,
    flagMessageValidator
} from '../services/chat.validator.services.js';


const router = express.Router();



// Apply auth to all chat routes
router.use(authenticationMiddleware);

// 1. Chats management
router.route('/chats')
    .post(
        createChatValidator(),
        validationMiddleware,
        activityLogger('CHAT', 'Create chat thread request'),
        createChat
    )
    .get(
        activityLogger('CHAT', 'Get all chats request'),
        getAllChats
    );

// 2. Chat messages
router.route('/chats/:chatId/messages')
    .get(
        activityLogger('CHAT', 'Get chat messages request'),
        getChatMessages
    )
    .post(
        sendMessageValidator(),
        validationMiddleware,
        activityLogger('CHAT', 'Send message request'),
        sendMessage
    );

// 3. Message level operations
router.route('/messages/:messageId')
    .patch(
        editMessageValidator(),
        validationMiddleware,
        activityLogger('CHAT', 'Edit own message request'),
        editOwnMessage
    );

router.route('/messages/:messageId/flag')
    .post(
        flagMessageValidator(),
        validationMiddleware,
        activityLogger('CHAT', 'Flag message request'),
        flagMessage
    );

router.route('/messages/:messageId/document')
    .post(
        uploadChatDocument,
        activityLogger('CHAT', 'Upload document to message request'),
        uploadDocument
    );

// 4. Document details
router.route('/documents/:documentId')
    .get(
        activityLogger('CHAT', 'Get document details request'),
        getDocumentDetails
    );

export default router;
