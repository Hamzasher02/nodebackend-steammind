import express from 'express';
import * as ctrl from '../controller/chatmoderation.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';

const router = express.Router();
const moderationGuard = [authenticationMiddleware, roleAuthorizationMiddleware('admin', 'website manager', 'chat moderation')];

router.get('/admin/chats', moderationGuard, ctrl.adminGetAllChats);
router.get('/admin/chats/:chatId/messages', moderationGuard, ctrl.adminGetChatMessages);
router.patch('/admin/messages/:messageId', moderationGuard, ctrl.adminEditMessage);
router.delete('/admin/messages/:messageId', moderationGuard, ctrl.adminDeleteMessage);
router.patch('/admin/messages/:messageId/recover', moderationGuard, ctrl.adminRecoverMessage);
router.patch('/admin/documents/:documentId', moderationGuard, ctrl.adminUpdateDocument);
router.delete('/admin/documents/:documentId', moderationGuard, ctrl.adminDeleteDocument);
router.patch('/admin/documents/:documentId/recover', moderationGuard, ctrl.adminRecoverDocument);
router.patch('/admin/chats/:chatId/terminate', moderationGuard, ctrl.adminTerminateChat);
router.patch('/admin/chats/:chatId/restore', moderationGuard, ctrl.adminRestoreChat);

// Flagged messages routes (with /admin/flags alias support for Postman)
router.get('/admin/flagged-messages', moderationGuard, ctrl.adminGetFlaggedMessages);
router.get('/admin/flags', moderationGuard, ctrl.adminGetFlaggedMessages);
router.get('/admin/flagged-messages/:flagId', moderationGuard, ctrl.adminGetFlaggedMessageDetail);
router.get('/admin/flags/:flagId', moderationGuard, ctrl.adminGetFlaggedMessageDetail);
router.delete('/admin/flagged-messages/:flagId', moderationGuard, ctrl.adminDeleteFlaggedMessage);

// User block/unblock routes (supporting both PATCH and POST for Postman collection compatibility)
router.patch('/admin/users/:userId/block', moderationGuard, ctrl.adminBlockUser);
router.post('/admin/users/:userId/block', moderationGuard, ctrl.adminBlockUser);
router.patch('/admin/users/:userId/unblock', moderationGuard, ctrl.adminUnblockUser);
router.post('/admin/users/:userId/unblock', moderationGuard, ctrl.adminUnblockUser);

export default router;

