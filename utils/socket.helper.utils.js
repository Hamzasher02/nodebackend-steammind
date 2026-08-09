export function emitMessageSent(req, message) {}
export function emitMessageUpdated(req, message, extra) {}
export function emitMessageFlagged(req, flagged, message, reason) {}
export function emitDocumentUploaded(req, document, message, name) {}
export function emitMessageRemoved(req, message) {}
export function emitChatTerminated(req, chat) {}
export function emitChatRestored(req, chat) {}
export function emitUserBlocked(req, user) {}
export function emitUserUnblocked(req, user) {}
