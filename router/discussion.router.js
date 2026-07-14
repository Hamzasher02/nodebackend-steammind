import express from 'express';
import {
    createDiscussionPost,
    getDiscussionPosts,
    getDiscussionDetail,
    toggleDiscussionLike,
    addDiscussionComment,
    getDiscussionComments,
    acceptAnswer,
    toggleCommentLike
} from '../controller/discussion.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import {
    createDiscussionPostValidator,
    getDiscussionPostsValidator,
    getDiscussionDetailValidator,
    toggleLikeValidator,
    addCommentValidator,
    getCommentsValidator,
    acceptAnswerValidator,
    toggleCommentLikeValidator
} from '../services/discussion.validator.services.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { discussionAttachments } from '../middleware/multer.middleware.js';

const router = express.Router();

// Create discussion post (with optional attachments)
router.post(
    '/createPost',
    authenticationMiddleware,
    discussionAttachments,
    createDiscussionPostValidator(),
    validationMiddleware,
    activityLogger("DISCUSSION", "Create discussion post request"),
    createDiscussionPost
);

// Get all discussion posts with pagination and filters
router.get(
    '/getPosts',
    authenticationMiddleware,
    getDiscussionPostsValidator(),
    validationMiddleware,
    activityLogger("DISCUSSION", "Get discussion posts request"),
    getDiscussionPosts
);

// Get single discussion post detail
router.get(
    '/getPost/:postId',
    authenticationMiddleware,
    getDiscussionDetailValidator(),
    validationMiddleware,
    activityLogger("DISCUSSION", "Get discussion detail request"),
    getDiscussionDetail
);

// Toggle like on a discussion post
router.post(
    '/toggleLike/:postId',
    authenticationMiddleware,
    toggleLikeValidator(),
    validationMiddleware,
    activityLogger("DISCUSSION", "Toggle discussion like request"),
    toggleDiscussionLike
);

// Add comment/answer to a discussion
router.post(
    '/addComment/:postId',
    authenticationMiddleware,
    addCommentValidator(),
    validationMiddleware,
    activityLogger("DISCUSSION", "Add discussion comment request"),
    addDiscussionComment
);

// Get comments for a discussion post
router.get(
    '/getComments/:postId',
    authenticationMiddleware,
    getCommentsValidator(),
    validationMiddleware,
    activityLogger("DISCUSSION", "Get discussion comments request"),
    getDiscussionComments
);

// Accept an answer (post author only)
router.patch(
    '/acceptAnswer/:commentId',
    authenticationMiddleware,
    acceptAnswerValidator(),
    validationMiddleware,
    activityLogger("DISCUSSION", "Accept answer request"),
    acceptAnswer
);

// Toggle like on a comment
router.post(
    '/toggleCommentLike/:commentId',
    authenticationMiddleware,
    toggleCommentLikeValidator(),
    validationMiddleware,
    activityLogger("DISCUSSION", "Toggle comment like request"),
    toggleCommentLike
);


export default router;
