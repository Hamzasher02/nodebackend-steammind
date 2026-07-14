import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    adminGetAllChats,
    adminGetChatMessages,
    adminEditMessage,
    adminDeleteMessage,
    adminRecoverMessage,
    adminUpdateDocument,
    adminDeleteDocument,
    adminRecoverDocument,
    adminTerminateChat,
    adminRestoreChat,
    adminGetFlaggedMessages,
    adminGetFlaggedMessageDetail,
    adminDeleteFlaggedMessage,
    adminBlockUser,
    adminUnblockUser
} from '../controller/chatmoderation.controller.js';
import {
    editMessageValidator,
    adminUpdateDocumentValidator
} from '../services/chat.validator.services.js';

const router = express.Router();

// Apply auth & permission middlewares to all moderation routes
router.use(authenticationMiddleware);

// 1. Chat list & messages moderation
router.route('/admin/chats')
    .get(
        routeAuthorizationMiddleware('chat moderation', 'read'),
        activityLogger('CHAT_MODERATION', 'Admin get all chats request'),
        adminGetAllChats
    );

router.route('/admin/chats/:chatId/messages')
    .get(
        routeAuthorizationMiddleware('chat moderation', 'read'),
        activityLogger('CHAT_MODERATION', 'Admin get chat messages request'),
        adminGetChatMessages
    );

// 2. Chat termination/restoration
router.route('/admin/chats/:chatId/terminate')
    .patch(
        routeAuthorizationMiddleware('chat moderation', 'update'),
        activityLogger('CHAT_MODERATION', 'Admin terminate chat request'),
        adminTerminateChat
    );

router.route('/admin/chats/:chatId/restore')
    .patch(
        routeAuthorizationMiddleware('chat moderation', 'update'),
        activityLogger('CHAT_MODERATION', 'Admin restore chat request'),
        adminRestoreChat
    );

// 3. Message level moderation
router.route('/admin/messages/:messageId')
    .patch(
        routeAuthorizationMiddleware('chat moderation', 'update'),
        editMessageValidator(),
        validationMiddleware,
        activityLogger('CHAT_MODERATION', 'Admin edit message request'),
        adminEditMessage
    )
    .delete(
        routeAuthorizationMiddleware('chat moderation', 'delete'),
        activityLogger('CHAT_MODERATION', 'Admin delete message request'),
        adminDeleteMessage
    );

router.route('/admin/messages/:messageId/recover')
    .patch(
        routeAuthorizationMiddleware('chat moderation', 'update'),
        activityLogger('CHAT_MODERATION', 'Admin recover message request'),
        adminRecoverMessage
    );

// 4. Document level moderation
router.route('/admin/documents/:documentId')
    .patch(
        routeAuthorizationMiddleware('chat moderation', 'update'),
        adminUpdateDocumentValidator(),
        validationMiddleware,
        activityLogger('CHAT_MODERATION', 'Admin update document metadata request'),
        adminUpdateDocument
    )
    .delete(
        routeAuthorizationMiddleware('chat moderation', 'delete'),
        activityLogger('CHAT_MODERATION', 'Admin delete document request'),
        adminDeleteDocument
    );

router.route('/admin/documents/:documentId/recover')
    .patch(
        routeAuthorizationMiddleware('chat moderation', 'update'),
        activityLogger('CHAT_MODERATION', 'Admin recover document request'),
        adminRecoverDocument
    );

// 5. Flagged message snapshots
router.route('/admin/flags')
    .get(
        routeAuthorizationMiddleware('chat moderation', 'read'),
        activityLogger('CHAT_MODERATION', 'Admin get flagged messages request'),
        adminGetFlaggedMessages
    );

router.route('/admin/flags/:flagId')
    .get(
        routeAuthorizationMiddleware('chat moderation', 'read'),
        activityLogger('CHAT_MODERATION', 'Admin get flagged message detail request'),
        adminGetFlaggedMessageDetail
    )
    .delete(
        routeAuthorizationMiddleware('chat moderation', 'delete'),
        activityLogger('CHAT_MODERATION', 'Admin delete flagged message snapshot request'),
        adminDeleteFlaggedMessage
    );

// 6. User block/unblock moderation actions
router.route('/admin/users/:userId/block')
    .post(
        routeAuthorizationMiddleware('chat moderation', 'update'),
        activityLogger('CHAT_MODERATION', 'Admin block user request'),
        adminBlockUser
    );

router.route('/admin/users/:userId/unblock')
    .post(
        routeAuthorizationMiddleware('chat moderation', 'update'),
        activityLogger('CHAT_MODERATION', 'Admin unblock user request'),
        adminUnblockUser
    );

export default router;
