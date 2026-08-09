import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import discussionPostModel from "../model/discussionpost.model.js";
import discussionCommentModel from "../model/discussioncomment.model.js";
import discussionLikeModel from "../model/discussionlike.model.js";
import categoryModel from "../model/category.model.js";
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from "../error/error.js";
import { uploadToCloud, deleteFromCloud } from "../services/cloudinary.uploader.services.js";
import fs from 'fs';

// Create a new discussion post
const createDiscussionPost = asyncWrapper(async (req, res) => {
    const { title, description, categoryId } = req.body;
    const userId = req.user.userId;

    // Validate category exists and is not deleted
    const category = await categoryModel.findOne({
        _id: categoryId,
        isDeleted: false
    });

    if (!category) {
        throw new NOT_FOUND("Category not found or has been deleted");
    }

    // Handle file attachments if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            try {
                const result = await uploadToCloud(file.path);
                const fileType = file.mimetype.startsWith('image/') ? 'image' : 'file';
                attachments.push({
                    publicId: result.publicId,
                    secureUrl: result.secureUrl,
                    fileType: fileType
                });
                // Clean up local file
                fs.unlinkSync(file.path);
            } catch (error) {
                // Clean up local file on error
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                throw error;
            }
        }
    }

    // Create the discussion post
    const post = await discussionPostModel.create({
        title: title.trim(),
        description: description.trim(),
        author: userId,
        categoryId: categoryId,
        attachments: attachments
    });

    // Populate author and category for response
    const populatedPost = await discussionPostModel
        .findById(post._id)
        .populate('author', 'firstName lastName email profilePicture')
        .populate('categoryId', 'categoryName');

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Discussion post created successfully",
        data: populatedPost
    });
});

// Get all discussion posts with pagination and filters
const getDiscussionPosts = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10, categoryId, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = { isDeleted: false };

    if (categoryId) {
        // Validate category exists
        const category = await categoryModel.findOne({
            _id: categoryId,
            isDeleted: false
        });
        if (!category) {
            throw new NOT_FOUND("Category not found");
        }
        filter.categoryId = categoryId;
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Get total count
    const total = await discussionPostModel.countDocuments(filter);

    // Get posts with pagination
    const posts = await discussionPostModel
        .find(filter)
        .populate('author', 'firstName lastName email profilePicture')
        .populate('categoryId', 'categoryName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    // Transform for frontend-friendly response
    const formattedPosts = posts.map(post => ({
        id: post._id,
        title: post.title,
        descriptionPreview: post.description.substring(0, 150) + (post.description.length > 150 ? '...' : ''),
        author: {
            id: post.author._id,
            firstName: post.author.firstName,
            lastName: post.author.lastName,
            profilePicture: post.author.profilePicture?.secureUrl || null
        },
        category: {
            id: post.categoryId._id,
            name: post.categoryId.categoryName
        },
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        status: post.status,
        createdAt: post.createdAt
    }));

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Discussion posts fetched successfully",
        data: {
            posts: formattedPosts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                totalPages: Math.ceil(total / limitNum)
            }
        }
    });
});

// Get single discussion post detail
const getDiscussionDetail = asyncWrapper(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await discussionPostModel
        .findOne({ _id: postId, isDeleted: false })
        .populate('author', 'firstName lastName email profilePicture')
        .populate('categoryId', 'categoryName');

    if (!post) {
        throw new NOT_FOUND("Discussion post not found");
    }

    // Check if current user has liked this post
    const userLike = await discussionLikeModel.findOne({
        user: userId,
        post: postId
    });

    const response = {
        id: post._id,
        title: post.title,
        description: post.description,
        author: {
            id: post.author._id,
            firstName: post.author.firstName,
            lastName: post.author.lastName,
            email: post.author.email,
            profilePicture: post.author.profilePicture?.secureUrl || null
        },
        category: {
            id: post.categoryId._id,
            name: post.categoryId.categoryName
        },
        attachments: post.attachments,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        status: post.status,
        isLikedByUser: !!userLike,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
    };

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Discussion post fetched successfully",
        data: response
    });
});

// Toggle like on a discussion post
const toggleDiscussionLike = asyncWrapper(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Check if post exists
    const post = await discussionPostModel.findOne({
        _id: postId,
        isDeleted: false
    });

    if (!post) {
        throw new NOT_FOUND("Discussion post not found");
    }

    // Check if user already liked this post
    const existingLike = await discussionLikeModel.findOne({
        user: userId,
        post: postId
    });

    let liked = false;
    if (existingLike) {
        // Unlike - remove the like
        await discussionLikeModel.deleteOne({ _id: existingLike._id });
        post.likeCount = Math.max(0, post.likeCount - 1);
        liked = false;
    } else {
        // Like - create new like
        await discussionLikeModel.create({
            user: userId,
            post: postId
        });
        post.likeCount += 1;
        liked = true;
    }

    await post.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: liked ? "Post liked successfully" : "Post unliked successfully",
        data: {
            liked: liked,
            likeCount: post.likeCount
        }
    });
});

// Add a comment/answer to a discussion
const addDiscussionComment = asyncWrapper(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Check if post exists
    const post = await discussionPostModel.findOne({
        _id: postId,
        isDeleted: false
    });

    if (!post) {
        throw new NOT_FOUND("Discussion post not found");
    }

    // Create comment
    const comment = await discussionCommentModel.create({
        post: postId,
        author: userId,
        content: content.trim()
    });

    // Update comment count on post
    post.commentCount += 1;
    // Update status to answered if first comment
    if (post.status === 'pending') {
        post.status = 'answered';
    }
    await post.save();

    // Populate author for response
    const populatedComment = await discussionCommentModel
        .findById(comment._id)
        .populate('author', 'firstName lastName email profilePicture');

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Comment added successfully",
        data: {
            id: populatedComment._id,
            content: populatedComment.content,
            author: {
                id: populatedComment.author._id,
                firstName: populatedComment.author.firstName,
                lastName: populatedComment.author.lastName,
                profilePicture: populatedComment.author.profilePicture?.secureUrl || null
            },
            isAccepted: populatedComment.isAccepted,
            likeCount: populatedComment.likeCount,
            createdAt: populatedComment.createdAt
        }
    });
});

// Get comments for a discussion post
const getDiscussionComments = asyncWrapper(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Check if post exists
    const post = await discussionPostModel.findOne({
        _id: postId,
        isDeleted: false
    });

    if (!post) {
        throw new NOT_FOUND("Discussion post not found");
    }

    // Get total count
    const total = await discussionCommentModel.countDocuments({
        post: postId,
        isDeleted: false
    });

    // Get comments with pagination (accepted answers first, then by date)
    const comments = await discussionCommentModel
        .find({ post: postId, isDeleted: false })
        .populate('author', 'firstName lastName email profilePicture')
        .sort({ isAccepted: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    // Get likes for current user on these comments
    const commentIds = comments.map(c => c._id);
    const userLikes = await discussionLikeModel.find({
        user: userId,
        comment: { $in: commentIds }
    });
    const likedCommentIds = new Set(userLikes.map(l => l.comment.toString()));

    // Format response
    const formattedComments = comments.map(comment => ({
        id: comment._id,
        content: comment.content,
        author: {
            id: comment.author._id,
            firstName: comment.author.firstName,
            lastName: comment.author.lastName,
            profilePicture: comment.author.profilePicture?.secureUrl || null
        },
        isAccepted: comment.isAccepted,
        likeCount: comment.likeCount,
        isLikedByUser: likedCommentIds.has(comment._id.toString()),
        createdAt: comment.createdAt
    }));

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Comments fetched successfully",
        data: {
            comments: formattedComments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                totalPages: Math.ceil(total / limitNum)
            }
        }
    });
});

// Accept an answer (post author only)
const acceptAnswer = asyncWrapper(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Find the comment
    const comment = await discussionCommentModel.findOne({
        _id: commentId,
        isDeleted: false
    });

    if (!comment) {
        throw new NOT_FOUND("Comment not found");
    }

    // Find the associated post
    const post = await discussionPostModel.findOne({
        _id: comment.post,
        isDeleted: false
    });

    if (!post) {
        throw new NOT_FOUND("Associated discussion post not found");
    }

    // Check if current user is the post author
    if (post.author.toString() !== userId) {
        throw new UNAUTHORIZED("Only the post author can accept an answer");
    }

    // Unaccept all other comments for this post
    await discussionCommentModel.updateMany(
        { post: comment.post, _id: { $ne: commentId } },
        { isAccepted: false }
    );

    // Toggle accept status on this comment
    comment.isAccepted = !comment.isAccepted;
    await comment.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: comment.isAccepted ? "Answer accepted successfully" : "Answer unaccepted successfully",
        data: {
            commentId: comment._id,
            isAccepted: comment.isAccepted
        }
    });
});

// Toggle like on a comment
const toggleCommentLike = asyncWrapper(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Check if comment exists
    const comment = await discussionCommentModel.findOne({
        _id: commentId,
        isDeleted: false
    });

    if (!comment) {
        throw new NOT_FOUND("Comment not found");
    }

    // Check if user already liked this comment
    const existingLike = await discussionLikeModel.findOne({
        user: userId,
        comment: commentId
    });

    let liked = false;
    if (existingLike) {
        // Unlike - remove the like
        await discussionLikeModel.deleteOne({ _id: existingLike._id });
        comment.likeCount = Math.max(0, comment.likeCount - 1);
        liked = false;
    } else {
        // Like - create new like
        await discussionLikeModel.create({
            user: userId,
            comment: commentId
        });
        comment.likeCount += 1;
        liked = true;
    }

    await comment.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: liked ? "Comment liked successfully" : "Comment unliked successfully",
        data: {
            liked: liked,
            likeCount: comment.likeCount
        }
    });
});
// Get categories for discussion (student accessible)


export {
    createDiscussionPost,
    getDiscussionPosts,
    getDiscussionDetail,
    toggleDiscussionLike,
    addDiscussionComment,
    getDiscussionComments,
    acceptAnswer,
    toggleCommentLike
};
