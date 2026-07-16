import cleanupUploadedFiles, { handleCloudinaryUpload } from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import chatModel from '../model/chat.model.js';
import messageModel from '../model/message.model.js';
import documentModel from '../model/document.model.js';
import flaggedMessageModel from '../model/flaggedmessage.model.js';
import userModel from '../model/user.model.js';
import { StatusCodes } from 'http-status-codes';
import {
    emitMessageSent,
    emitMessageUpdated,
    emitMessageFlagged,
    emitDocumentUploaded
} from '../utils/socket.helper.utils.js';

// Helper to consolidate chat existence, participation, and termination validations
async function getAndValidateChat(chatId, userId, checkParticipant = true, checkTerminated = true, reqForCleanup = null) {
    const query = { _id: chatId, isDeleted: false };
    if (checkParticipant) {
        query.participants = userId;
    }
    const chat = await chatModel.findOne(query);
    if (!chat) {
        if (reqForCleanup) cleanupUploadedFiles(reqForCleanup);
        if (checkParticipant) {
            throw new NOT_FOUND('Chat thread not found or access denied');
        } else {
            throw new NOT_FOUND('Chat thread not found');
        }
    }
    if (checkTerminated && chat.status === 'terminated') {
        if (reqForCleanup) cleanupUploadedFiles(reqForCleanup);
        throw new BAD_REQUEST('This chat communication has been terminated by an admin');
    }
    return chat;
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

    res.status(StatusCodes.CREATED).json({
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

    res.status(StatusCodes.OK).json({
        success: true,
        data: chats
    });
});

// 3. Get chat messages
const getChatMessages = asyncWrapper(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // Verify user is participant in the chat (terminated chats can still be viewed)
    await getAndValidateChat(chatId, userId, true, false);

    const messages = await messageModel.find({
        chatId,
        isDeleted: false
    })
    .populate('documentId')
    .sort({ createdAt: 1 });

    res.status(StatusCodes.OK).json({
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

    // Verify chat exists, user is participant, and chat is active
    await getAndValidateChat(chatId, userId, true, true);

    const message = await messageModel.create({
        chatId,
        senderId: userId,
        messageText: messageText || ''
    });

    emitMessageSent(req, message);

    res.status(StatusCodes.CREATED).json({
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

    // Verify chat is active (not terminated)
    await getAndValidateChat(message.chatId, userId, false, true);

    // Verify within 24 hours
    const limitTime = 24 * 60 * 60 * 1000;
    if (new Date() - message.createdAt > limitTime) {
        throw new BAD_REQUEST('Messages can only be edited within 24 hours of creation');
    }

    message.messageText = messageText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    emitMessageUpdated(req, message);

    res.status(StatusCodes.OK).json({
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

    emitMessageFlagged(req, flagged, message, reason);

    res.status(StatusCodes.CREATED).json({
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
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Message not found or you are not authorized');
    }

    // Verify chat is not terminated
    await getAndValidateChat(message.chatId, userId, false, true, req);

    const cloudResult = await handleCloudinaryUpload(req, req.file);

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

    cleanupUploadedFiles(req);

    emitDocumentUploaded(req, document, message, req.file.originalname);

    res.status(StatusCodes.CREATED).json({
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

    res.status(StatusCodes.OK).json({
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
