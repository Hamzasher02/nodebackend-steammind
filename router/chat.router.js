import express from 'express';
import * as ctrl from '../controller/chat.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }).single('document');

// Protected Chat User Routes (all require valid authentication token/cookie)
router.get('/chats', authenticationMiddleware, ctrl.getAllChats);
router.post('/chats', authenticationMiddleware, ctrl.createChat);

router.get('/chats/:chatId/messages', authenticationMiddleware, ctrl.getChatMessages);
router.post('/chats/:chatId/messages', authenticationMiddleware, ctrl.sendMessage);

router.patch('/messages/:messageId', authenticationMiddleware, ctrl.editOwnMessage);
router.post('/messages/:messageId/flag', authenticationMiddleware, ctrl.flagMessage);
router.post('/messages/:messageId/document', authenticationMiddleware, upload, ctrl.uploadDocument);
router.get('/documents/:documentId', authenticationMiddleware, ctrl.getDocumentDetails);

export default router;
