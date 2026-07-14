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
import { attachCookie } from '../utils/cookies.utils.js';
import userModel from '../model/user.model.js';
import staffModel from '../model/staff.model.js';
import refreshTokenModel from '../model/refreshtoken.model.js';

const router = express.Router();

// Helper test-login route (public)
router.get('/auth/test-login/:role', async (req, res, next) => {
    try {
        const { role } = req.params;
        let user;
        if (role === 'admin') {
            let staff = await staffModel.findOne({ email: 'admin@test.com' });
            if (!staff) {
                staff = await staffModel.create({
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@test.com',
                    password: 'TestPassword123',
                    profilePicture: { secureUrl: 'https://example.com/admin.jpg', publicId: 'admin_pic' },
                    roleStatus: 'active',
                    role: 'admin'
                });
            }
            user = {
                userId: staff._id,
                email: staff.email,
                role: 'admin',
                firstName: staff.firstName,
                lastName: staff.lastName
            };
        } else if (role === 'student' || role === 'instructor') {
            user = await userModel.findOne({ role });
            if (!user) {
                user = await userModel.create({
                    firstName: role === 'student' ? 'Rimsha' : 'Kevin',
                    lastName: role === 'student' ? 'Latif' : 'Gilbert',
                    fatherName: 'Test Father',
                    email: `${role}@test.com`,
                    phoneNumber: role === 'student' ? '+923000000001' : '+923000000002',
                    role,
                    bio: `Mock bio for ${role}`,
                    consentAccepted: true,
                    accountStatus: 'active',
                    password: 'TestPassword123',
                    profilePicture: { secureUrl: 'https://example.com/p.jpg', publicId: `${role}_pic` }
                });
            }
            user = {
                userId: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            };
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const refreshToken = 'test-refresh-token-' + Math.random();
        await refreshTokenModel.create({
            createdBy: user.userId,
            refreshToken,
            isValid: true,
            userAgent: req.headers['user-agent'] || 'test-agent',
            ip: req.ip || '127.0.0.1'
        });

        attachCookie({ user, refreshToken, res });
        res.status(200).json({ success: true, message: `Logged in as ${role}`, user });
    } catch (err) {
        next(err);
    }
});

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
