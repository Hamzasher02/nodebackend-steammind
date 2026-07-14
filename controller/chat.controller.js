import fs from 'fs';
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import chatModel from '../model/chat.model.js';
import messageModel from '../model/message.model.js';
import documentModel from '../model/document.model.js';
import flaggedMessageModel from '../model/flaggedmessage.model.js';
import userModel from '../model/user.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Safe cleanup for local uploads
function safeCleanup(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
}

// 1. Create chat with instructor (Student Side only)
const createChat = asyncWrapper(async (req, res) => {
    const { recipientId } = req.body;
    const userId = req.user.userId;

    if (req.user.role !== 'student') {
        throw new UNAUTHORIZED('Only students can initiate chat threads');
    }

    // Verify recipient exists and is an instructor
    const recipient = await userModel.findById(recipientId);
    if (!recipient) {
        throw new NOT_FOUND('Recipient instructor not found');
    }
    if (recipient.role !== 'instructor') {
        throw new BAD_REQUEST('Recipient must be an instructor');
    }

    // Check if chat already exists
    let chat = await chatModel.findOne({
        participants: { $all: [userId, recipientId] },
        isDeleted: false
    });

    if (!chat) {
        chat = await chatModel.create({
            participants: [userId, recipientId],
            createdBy: userId
        });
    }

    res.status(201).json({
        success: true,
        message: 'Chat thread created successfully',
        data: chat
    });
});

// 2. Get all chats (Both student and instructor)
const getAllChats = asyncWrapper(async (req, res) => {
    const userId = req.user.userId;

    const chats = await chatModel.find({
        participants: userId,
        isDeleted: false
    }).populate('participants', 'firstName lastName email profilePicture role');

    res.status(200).json({
        success: true,
        data: chats
    });
});

// 3. Get chat messages
const getChatMessages = asyncWrapper(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // Verify user is participant in the chat
    const chat = await chatModel.findOne({ _id: chatId, participants: userId, isDeleted: false });
    if (!chat) {
        throw new NOT_FOUND('Chat thread not found or access denied');
    }

    const messages = await messageModel.find({
        chatId,
        isDeleted: false
    })
    .populate('documentId')
    .sort({ createdAt: 1 });

    res.status(200).json({
        success: true,
        data: messages
    });
});

// 4. Send message
const sendMessage = asyncWrapper(async (req, res) => {
    const { chatId } = req.params;
    const { messageText } = req.body;
    const userId = req.user.userId;

    // Validate blocked/inactive user status
    const activeUser = await userModel.findById(userId);
    if (activeUser && activeUser.accountStatus === 'inactive') {
        throw new UNAUTHORIZED('Your account is blocked or inactive');
    }

    // Verify chat exists and user is participant
    const chat = await chatModel.findOne({ _id: chatId, participants: userId, isDeleted: false });
    if (!chat) {
        throw new NOT_FOUND('Chat thread not found or access denied');
    }

    if (chat.status === 'terminated') {
        throw new BAD_REQUEST('This chat communication has been terminated by an admin');
    }

    const message = await messageModel.create({
        chatId,
        senderId: userId,
        messageText: messageText || ''
    });

    // Real-time notifications: message:sent & message:received
    const io = req.app.get('io');
    if (io) {
        io.emit('message:sent', {
            chatId,
            messageId: message._id,
            senderId: userId,
            messageText: message.messageText,
            createdAt: message.createdAt
        });
        io.emit('message:received', {
            chatId,
            messageId: message._id,
            senderId: userId
        });
    }

    res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message
    });
});

// 5. Edit own message
const editOwnMessage = asyncWrapper(async (req, res) => {
    const { messageId } = req.params;
    const { messageText } = req.body;
    const userId = req.user.userId;

    const message = await messageModel.findOne({ _id: messageId, senderId: userId, isDeleted: false });
    if (!message) {
        throw new NOT_FOUND('Message not found or you are not authorized to edit this message');
    }

    // Verify chat is not terminated
    const chat = await chatModel.findOne({ _id: message.chatId, isDeleted: false });
    if (!chat) {
        throw new NOT_FOUND('Chat thread not found');
    }
    if (chat.status === 'terminated') {
        throw new BAD_REQUEST('This chat communication has been terminated by an admin');
    }

    // Verify within 24 hours
    const limitTime = 24 * 60 * 60 * 1000;
    if (new Date() - message.createdAt > limitTime) {
        throw new BAD_REQUEST('Messages can only be edited within 24 hours of creation');
    }

    message.messageText = messageText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Real-time notification: message:updated
    const io = req.app.get('io');
    if (io) {
        io.emit('message:updated', {
            messageId: message._id,
            chatId: message.chatId,
            messageText: message.messageText,
            editedAt: message.editedAt
        });
    }

    res.status(200).json({
        success: true,
        message: 'Message updated successfully',
        data: message
    });
});

// 6. Flag message
const flagMessage = asyncWrapper(async (req, res) => {
    const { messageId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const message = await messageModel.findOne({ _id: messageId, isDeleted: false });
    if (!message) {
        throw new NOT_FOUND('Message not found');
    }

    // Verify flagging user participates in the chat
    const chat = await chatModel.findOne({ _id: message.chatId, participants: userId, isDeleted: false });
    if (!chat) {
        throw new UNAUTHORIZED('You are not authorized to flag messages in this chat thread');
    }

    // Create FlaggedMessage snapshot
    const flagged = await flaggedMessageModel.create({
        messageId: message._id,
        chatId: message.chatId,
        senderId: message.senderId,
        flaggedBy: userId,
        reason,
        messageSnapshot: message.messageText
    });

    // Real-time notification: message:flagged
    const io = req.app.get('io');
    if (io) {
        io.emit('message:flagged', {
            flagId: flagged._id,
            messageId: message._id,
            chatId: message.chatId,
            reason
        });
    }

    res.status(201).json({
        success: true,
        message: 'Message flagged successfully',
        data: flagged
    });
});

// 7. Upload document to message
const uploadDocument = asyncWrapper(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;

    if (!req.file) {
        throw new BAD_REQUEST('No document file uploaded');
    }

    const message = await messageModel.findOne({ _id: messageId, senderId: userId, isDeleted: false });
    if (!message) {
        safeCleanup(req);
        throw new NOT_FOUND('Message not found or you are not authorized');
    }

    // Verify chat is not terminated
    const chat = await chatModel.findOne({ _id: message.chatId, isDeleted: false });
    if (!chat) {
        safeCleanup(req);
        throw new NOT_FOUND('Chat thread not found');
    }
    if (chat.status === 'terminated') {
        safeCleanup(req);
        throw new BAD_REQUEST('This chat communication has been terminated by an admin');
    }

    let cloudResult;
    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    const document = await documentModel.create({
        messageId: message._id,
        uploadedBy: userId,
        file: {
            secureUrl: cloudResult.secureUrl,
            publicId: cloudResult.publicId,
            originalName: req.file.originalname
        }
    });

    // Link document to message
    message.documentId = document._id;
    await message.save();

    safeCleanup(req);

    // Real-time notification: document:uploaded
    const io = req.app.get('io');
    if (io) {
        io.emit('document:uploaded', {
            documentId: document._id,
            messageId: message._id,
            chatId: message.chatId,
            fileName: req.file.originalname
        });
    }

    res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
    });
});

// 8. Get document details
const getDocumentDetails = asyncWrapper(async (req, res) => {
    const { documentId } = req.params;

    const doc = await documentModel.findOne({ _id: documentId, isDeleted: false });
    if (!doc) {
        throw new NOT_FOUND('Document not found');
    }

    res.status(200).json({
        success: true,
        data: doc
    });
});

export {
    createChat,
    getAllChats,
    getChatMessages,
    sendMessage,
    editOwnMessage,
    flagMessage,
    uploadDocument,
    getDocumentDetails
};
