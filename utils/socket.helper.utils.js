const SOCKET_EVENTS = Object.freeze({
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_UPDATED: 'message:updated',
    MESSAGE_REMOVED: 'message:removed',
    MESSAGE_FLAGGED: 'message:flagged',
    DOCUMENT_UPLOADED: 'document:uploaded',
    CHAT_TERMINATED: 'chat:terminated',
    CHAT_RESTORED: 'chat:restored',
    USER_BLOCKED: 'user:blocked',
    USER_UNBLOCKED: 'user:unblocked'
});

function emitSocketEvent(req, eventName, payload) {
    const io = req.app.get('io');
    if (!io) return;

    io.emit(eventName, payload);
}

/**
 * Emits socket notification when a new message is sent.
 */
function emitMessageSent(req, message) {
    emitSocketEvent(req, SOCKET_EVENTS.MESSAGE_SENT, {
        chatId: message.chatId,
        messageId: message._id,
        senderId: message.senderId,
        messageText: message.messageText,
        createdAt: message.createdAt
    });
    emitSocketEvent(req, SOCKET_EVENTS.MESSAGE_RECEIVED, {
        chatId: message.chatId,
        messageId: message._id,
        senderId: message.senderId
    });
}

/**
 * Emits socket notification when a message is updated (edited or recovered).
 */
function emitMessageUpdated(req, message, extra = {}) {
    emitSocketEvent(req, SOCKET_EVENTS.MESSAGE_UPDATED, {
        messageId: message._id,
        chatId: message.chatId,
        messageText: message.messageText,
        editedAt: message.editedAt,
        ...extra
    });
}

/**
 * Emits socket notification when a message is flagged.
 */
function emitMessageFlagged(req, flagged, message, reason) {
    emitSocketEvent(req, SOCKET_EVENTS.MESSAGE_FLAGGED, {
        flagId: flagged._id,
        messageId: message._id,
        chatId: message.chatId,
        reason
    });
}

/**
 * Emits socket notification when a document is uploaded.
 */
function emitDocumentUploaded(req, document, message, originalName) {
    emitSocketEvent(req, SOCKET_EVENTS.DOCUMENT_UPLOADED, {
        documentId: document._id,
        messageId: message._id,
        chatId: message.chatId,
        fileName: originalName
    });
}

/**
 * Emits socket notification when a message is soft-deleted.
 */
function emitMessageRemoved(req, message) {
    emitSocketEvent(req, SOCKET_EVENTS.MESSAGE_REMOVED, {
        messageId: message._id,
        chatId: message.chatId
    });
}

/**
 * Emits socket notification when a chat is terminated by admin.
 */
function emitChatTerminated(req, chat) {
    emitSocketEvent(req, SOCKET_EVENTS.CHAT_TERMINATED, {
        chatId: chat._id
    });
}

/**
 * Emits socket notification when a chat is restored by admin.
 */
function emitChatRestored(req, chat) {
    emitSocketEvent(req, SOCKET_EVENTS.CHAT_RESTORED, {
        chatId: chat._id
    });
}

/**
 * Emits socket notification when a user is blocked.
 */
function emitUserBlocked(req, user) {
    emitSocketEvent(req, SOCKET_EVENTS.USER_BLOCKED, {
        userId: user._id
    });
}

/**
 * Emits socket notification when a user is unblocked.
 */
function emitUserUnblocked(req, user) {
    emitSocketEvent(req, SOCKET_EVENTS.USER_UNBLOCKED, {
        userId: user._id
    });
}

export {
    SOCKET_EVENTS,
    emitSocketEvent,
    emitMessageSent,
    emitMessageUpdated,
    emitMessageFlagged,
    emitDocumentUploaded,
    emitMessageRemoved,
    emitChatTerminated,
    emitChatRestored,
    emitUserBlocked,
    emitUserUnblocked
};
