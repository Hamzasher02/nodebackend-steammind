import { NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import chatModel from '../model/chat.model.js';
import messageModel from '../model/message.model.js';
import documentModel from '../model/document.model.js';
import flaggedMessageModel from '../model/flaggedmessage.model.js';
import userModel from '../model/user.model.js';
import { StatusCodes } from 'http-status-codes';
import {
    emitMessageUpdated,
    emitMessageRemoved,
    emitChatTerminated,
    emitChatRestored,
    emitUserBlocked,
    emitUserUnblocked
} from '../utils/socket.helper.utils.js';

// 1. Get all chats (Admin Side)
const adminGetAllChats = asyncWrapper(async (req, res) => {
    const chats = await chatModel.find({ isDeleted: false })
        .populate('participants', 'firstName lastName email profilePicture role accountStatus');

    res.status(StatusCodes.OK).json({
        success: true,
        data: chats
    });
});

// 2. Get chat messages (Admin Side)
const adminGetChatMessages = asyncWrapper(async (req, res) => {
    const { chatId } = req.params;

    const messages = await messageModel.find({ chatId, isDeleted: false })
        .populate('documentId')
        .sort({ createdAt: 1 });

    res.status(StatusCodes.OK).json({
        success: true,
        data: messages
    });
});

// 3. Edit any message (Admin Side)
const adminEditMessage = asyncWrapper(async (req, res) => {
    const { messageId } = req.params;
    const { messageText } = req.body;

    const message = await messageModel.findOne({ _id: messageId, isDeleted: false });
    if (!message) {
        throw new NOT_FOUND('Message not found');
    }

    message.messageText = messageText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    emitMessageUpdated(req, message, { editedByAdmin: true });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Message edited by admin successfully',
        data: message
    });
});

// 4. Delete any message (Admin Side - Soft Delete)
const adminDeleteMessage = asyncWrapper(async (req, res) => {
    const { messageId } = req.params;

    const message = await messageModel.findOne({ _id: messageId, isDeleted: false });
    if (!message) {
        throw new NOT_FOUND('Message not found');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    emitMessageRemoved(req, message);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Message soft deleted by admin successfully',
        data: message
    });
});

// 4b. Recover message (Admin Side - Restore Soft Delete)
const adminRecoverMessage = asyncWrapper(async (req, res) => {
    const { messageId } = req.params;

    const message = await messageModel.findOne({ _id: messageId, isDeleted: true });
    if (!message) {
        throw new NOT_FOUND('Deleted message not found');
    }

    message.isDeleted = false;
    message.deletedAt = null;
    await message.save();

    emitMessageUpdated(req, message, { recovered: true });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Message recovered successfully',
        data: message
    });
});

// 5. Update document metadata (Admin Side)
const adminUpdateDocument = asyncWrapper(async (req, res) => {
    const { documentId } = req.params;
    const { originalName } = req.body;

    const doc = await documentModel.findOne({ _id: documentId, isDeleted: false });
    if (!doc) {
        throw new NOT_FOUND('Document not found');
    }

    doc.file.originalName = originalName;
    await doc.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Document metadata updated successfully',
        data: doc
    });
});

// 6. Delete document (Admin Side - Soft Delete)
const adminDeleteDocument = asyncWrapper(async (req, res) => {
    const { documentId } = req.params;

    const doc = await documentModel.findOne({ _id: documentId, isDeleted: false });
    if (!doc) {
        throw new NOT_FOUND('Document not found');
    }

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();

    // Clear documentId link in parent message if applicable
    await messageModel.updateOne({ documentId: doc._id }, { $set: { documentId: null } });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Document soft deleted successfully',
        data: doc
    });
});

// 6b. Recover document (Admin Side - Restore Soft Delete)
const adminRecoverDocument = asyncWrapper(async (req, res) => {
    const { documentId } = req.params;

    const doc = await documentModel.findOne({ _id: documentId, isDeleted: true });
    if (!doc) {
        throw new NOT_FOUND('Deleted document not found');
    }

    doc.isDeleted = false;
    doc.deletedAt = null;
    await doc.save();

    // Relink document to parent message if message exists
    await messageModel.updateOne({ _id: doc.messageId }, { $set: { documentId: doc._id } });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Document recovered successfully',
        data: doc
    });
});

// 7. Terminate chat communication
const adminTerminateChat = asyncWrapper(async (req, res) => {
    const { chatId } = req.params;

    const chat = await chatModel.findOne({ _id: chatId, isDeleted: false });
    if (!chat) {
        throw new NOT_FOUND('Chat not found');
    }

    chat.status = 'terminated';
    await chat.save();

    emitChatTerminated(req, chat);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Chat communication terminated by admin successfully',
        data: chat
    });
});

// 8. Restore chat communication
const adminRestoreChat = asyncWrapper(async (req, res) => {
    const { chatId } = req.params;

    const chat = await chatModel.findOne({ _id: chatId, isDeleted: false });
    if (!chat) {
        throw new NOT_FOUND('Chat not found');
    }

    chat.status = 'active';
    await chat.save();

    emitChatRestored(req, chat);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Chat communication restored by admin successfully',
        data: chat
    });
});

// 9. Get all flagged message snapshots
const adminGetFlaggedMessages = asyncWrapper(async (req, res) => {
    const flags = await flaggedMessageModel.find()
        .populate('messageId')
        .populate('senderId', 'firstName lastName email')
        .populate('flaggedBy', 'firstName lastName email');

    res.status(StatusCodes.OK).json({
        success: true,
        data: flags
    });
});

// 10. Get flagged message snapshot detail
const adminGetFlaggedMessageDetail = asyncWrapper(async (req, res) => {
    const { flagId } = req.params;

    const flag = await flaggedMessageModel.findById(flagId)
        .populate('messageId')
        .populate('senderId', 'firstName lastName email')
        .populate('flaggedBy', 'firstName lastName email');

    if (!flag) {
        throw new NOT_FOUND('Flagged message snapshot not found');
    }

    res.status(StatusCodes.OK).json({
        success: true,
        data: flag
    });
});

// 11. Delete flagged message snapshot
const adminDeleteFlaggedMessage = asyncWrapper(async (req, res) => {
    const { flagId } = req.params;

    const flag = await flaggedMessageModel.findById(flagId);
    if (!flag) {
        throw new NOT_FOUND('Flagged message snapshot not found');
    }

    await flag.deleteOne();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Flagged message snapshot deleted from moderation logs successfully'
    });
});

// 12. Block User (Emits user:blocked)
const adminBlockUser = asyncWrapper(async (req, res) => {
    const { userId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
        throw new NOT_FOUND('User not found');
    }

    user.accountStatus = 'inactive';
    await user.save();

    emitUserBlocked(req, user);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User blocked and account deactivated successfully',
        data: user
    });
});

// 13. Unblock User (Emits user:unblocked)
const adminUnblockUser = asyncWrapper(async (req, res) => {
    const { userId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
        throw new NOT_FOUND('User not found');
    }

    user.accountStatus = 'active';
    await user.save();

    emitUserUnblocked(req, user);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User unblocked and account activated successfully',
        data: user
    });
});

export {
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
};
