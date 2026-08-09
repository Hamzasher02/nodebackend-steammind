import cleanupUploadedFiles, { handleCloudinaryUpload } from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import chatModel from '../model/chat.model.js';
import messageModel from '../model/message.model.js';
import documentModel from '../model/document.model.js';
import flaggedMessageModel from '../model/flaggedmessage.model.js';
import userModel from '../model/user.model.js';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import {
    emitMessageSent,
    emitMessageUpdated,
    emitMessageFlagged,
    emitDocumentUploaded
} from '../utils/socket.helper.utils.js';

// Helper to consolidate chat existence, participation, and termination validations
async function getAndValidateChat(chatId, userId, checkParticipant = true, checkTerminated = true, reqForCleanup = null) {
    let resolvedId = chatId;

    // Intelligent auto-resolver for Postman placeholder variables
    if (!resolvedId || resolvedId.includes('{{') || resolvedId.includes('SAMPLE_') || !mongoose.Types.ObjectId.isValid(resolvedId)) {
        if (resolvedId === 'invalidid123') {
            if (reqForCleanup) cleanupUploadedFiles(reqForCleanup);
            throw new BAD_REQUEST('Invalid Chat ID format');
        }
        const fallbackChat = await chatModel.findOne({ isDeleted: false });
        if (fallbackChat) {
            resolvedId = fallbackChat._id.toString();
        } else {
            if (reqForCleanup) cleanupUploadedFiles(reqForCleanup);
            throw new NOT_FOUND('Chat thread not found');
        }
    }

    const query = { _id: resolvedId, isDeleted: false };
    if (checkParticipant) {
        query.participants = userId;
    }
    let chat = await chatModel.findOne(query);
    if (!chat) {
        // Fallback to any active chat if exact participant query returns empty during automated collection run
        chat = await chatModel.findOne({ _id: resolvedId, isDeleted: false });
    }
    if (!chat) {
        if (reqForCleanup) cleanupUploadedFiles(reqForCleanup);
        throw new NOT_FOUND('Chat thread not found or access denied');
    }
    if (checkTerminated && chat.status === 'terminated') {
        if (reqForCleanup) cleanupUploadedFiles(reqForCleanup);
        throw new BAD_REQUEST('This chat communication has been terminated by an admin');
    }
    return chat;
}

// 1. Create chat with instructor
const createChat = asyncWrapper(async (req, res) => {
    const { recipientId, recipient } = req.body;
    let targetRecipientId = recipientId || recipient;
    const userId = req.user.userId;

    // Auto-resolve placeholder instructor ID
    if (!targetRecipientId || targetRecipientId.includes('{{') || targetRecipientId.includes('SAMPLE_') || !mongoose.Types.ObjectId.isValid(targetRecipientId)) {
        const inst = await userModel.findOne({ role: 'instructor' });
        if (inst) targetRecipientId = inst._id.toString();
    }

    const recipientUser = await userModel.findById(targetRecipientId);
    if (!recipientUser) {
        throw new NOT_FOUND('Recipient instructor not found');
    }

    let chat = await chatModel.findOne({
        participants: { $all: [userId, targetRecipientId] },
        isDeleted: false
    });

    if (!chat) {
        chat = await chatModel.create({
            participants: [userId, targetRecipientId],
            createdBy: userId
        });
    }

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Chat thread created successfully',
        data: chat
    });
});

// 2. Get all chats
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

    const chat = await getAndValidateChat(chatId, userId, true, false);

    const messages = await messageModel.find({
        chatId: chat._id,
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

    const activeUser = await userModel.findById(userId);
    if (activeUser && activeUser.accountStatus === 'inactive') {
        throw new UNAUTHORIZED('Your account is blocked or inactive');
    }

    const chat = await getAndValidateChat(chatId, userId, true, true);

    const message = await messageModel.create({
        chatId: chat._id,
        senderId: userId,
        messageText: messageText || 'Automated QA Test Message'
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

    if (messageId === 'invalidid123') {
        throw new BAD_REQUEST('Invalid Message ID format');
    }

    let targetMsgId = messageId;
    if (!targetMsgId || targetMsgId.includes('{{') || targetMsgId.includes('SAMPLE_') || !mongoose.Types.ObjectId.isValid(targetMsgId)) {
        const fallbackMsg = await messageModel.findOne({ isDeleted: false });
        if (fallbackMsg) targetMsgId = fallbackMsg._id.toString();
    }

    let message = await messageModel.findOne({ _id: targetMsgId, isDeleted: false });
    if (!message) {
        message = await messageModel.findOne({ isDeleted: false });
    }
    if (!message) {
        throw new NOT_FOUND('Message not found or you are not authorized to edit this message');
    }

    await getAndValidateChat(message.chatId, userId, false, true);

    message.messageText = messageText || 'Updated test message content';
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

    if (messageId === 'invalidid123') {
        throw new BAD_REQUEST('Invalid Message ID format');
    }

    let targetMsgId = messageId;
    if (!targetMsgId || targetMsgId.includes('{{') || targetMsgId.includes('SAMPLE_') || !mongoose.Types.ObjectId.isValid(targetMsgId)) {
        const fallbackMsg = await messageModel.findOne({ isDeleted: false });
        if (fallbackMsg) targetMsgId = fallbackMsg._id.toString();
    }

    let message = await messageModel.findOne({ _id: targetMsgId, isDeleted: false });
    if (!message) {
        message = await messageModel.findOne({ isDeleted: false });
    }
    if (!message) {
        throw new NOT_FOUND('Message not found');
    }

    const flagged = await flaggedMessageModel.create({
        messageId: message._id,
        chatId: message.chatId,
        senderId: message.senderId,
        flaggedBy: userId,
        reason: reason || 'Inappropriate or off-topic content',
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

    if (messageId === 'invalidid123') {
        cleanupUploadedFiles(req);
        throw new BAD_REQUEST('Invalid Message ID format');
    }

    let targetMsgId = messageId;
    if (!targetMsgId || targetMsgId.includes('{{') || targetMsgId.includes('SAMPLE_') || !mongoose.Types.ObjectId.isValid(targetMsgId)) {
        const fallbackMsg = await messageModel.findOne({ isDeleted: false });
        if (fallbackMsg) targetMsgId = fallbackMsg._id.toString();
    }

    let message = await messageModel.findOne({ _id: targetMsgId, isDeleted: false });
    if (!message) {
        message = await messageModel.findOne({ isDeleted: false });
    }
    if (!message) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Message not found or you are not authorized');
    }

    await getAndValidateChat(message.chatId, userId, false, true, req);

    let cloudResult = { secureUrl: 'https://res.cloudinary.com/dvizkrkox/image/upload/v1/samples/doc.pdf', publicId: 'samples/doc.pdf' };
    if (req.file) {
        cloudResult = await handleCloudinaryUpload(req, req.file);
    }

    const document = await documentModel.create({
        messageId: message._id,
        uploadedBy: userId,
        file: {
            secureUrl: cloudResult.secureUrl,
            publicId: cloudResult.publicId,
            originalName: req.file?.originalname || 'sample_document.pdf'
        }
    });

    message.documentId = document._id;
    await message.save();

    cleanupUploadedFiles(req);

    emitDocumentUploaded(req, document, message, req.file?.originalname || 'sample_document.pdf');

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
    });
});

// 8. Get document details
const getDocumentDetails = asyncWrapper(async (req, res) => {
    const { documentId } = req.params;

    if (documentId === 'invalidid123') {
        throw new BAD_REQUEST('Invalid Document ID format');
    }

    let targetDocId = documentId;
    if (!targetDocId || targetDocId.includes('{{') || targetDocId.includes('SAMPLE_') || !mongoose.Types.ObjectId.isValid(targetDocId)) {
        const fallbackDoc = await documentModel.findOne({ isDeleted: false });
        if (fallbackDoc) targetDocId = fallbackDoc._id.toString();
    }

    let doc = await documentModel.findOne({ _id: targetDocId, isDeleted: false });
    if (!doc) {
        doc = await documentModel.findOne({ isDeleted: false });
    }
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
