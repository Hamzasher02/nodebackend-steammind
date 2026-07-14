import { body, param, query } from "express-validator";

const createDiscussionPostValidator = () => [
    body("title")
        .notEmpty().withMessage("Title is required")
        .isString().withMessage("Title must be a string")
        .trim()
        .isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters"),

    body("description")
        .notEmpty().withMessage("Description is required")
        .isString().withMessage("Description must be a string")
        .trim()
        .isLength({ min: 10, max: 5000 }).withMessage("Description must be between 10 and 5000 characters"),

    body("categoryId")
        .notEmpty().withMessage("Category ID is required")
        .isMongoId().withMessage("Invalid category ID format")
];

const getDiscussionPostsValidator = () => [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),

    query("categoryId")
        .optional()
        .isMongoId().withMessage("Invalid category ID format"),

    query("search")
        .optional()
        .isString().withMessage("Search must be a string")
        .trim()
];

const getDiscussionDetailValidator = () => [
    param("postId")
        .notEmpty().withMessage("Post ID is required")
        .isMongoId().withMessage("Invalid post ID format")
];

const toggleLikeValidator = () => [
    param("postId")
        .notEmpty().withMessage("Post ID is required")
        .isMongoId().withMessage("Invalid post ID format")
];

const addCommentValidator = () => [
    param("postId")
        .notEmpty().withMessage("Post ID is required")
        .isMongoId().withMessage("Invalid post ID format"),

    body("content")
        .notEmpty().withMessage("Comment content is required")
        .isString().withMessage("Content must be a string")
        .trim()
        .isLength({ min: 5, max: 2000 }).withMessage("Content must be between 5 and 2000 characters")
];

const getCommentsValidator = () => [
    param("postId")
        .notEmpty().withMessage("Post ID is required")
        .isMongoId().withMessage("Invalid post ID format"),

    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50")
];

const acceptAnswerValidator = () => [
    param("commentId")
        .notEmpty().withMessage("Comment ID is required")
        .isMongoId().withMessage("Invalid comment ID format")
];

const toggleCommentLikeValidator = () => [
    param("commentId")
        .notEmpty().withMessage("Comment ID is required")
        .isMongoId().withMessage("Invalid comment ID format")
];

export {
    createDiscussionPostValidator,
    getDiscussionPostsValidator,
    getDiscussionDetailValidator,
    toggleLikeValidator,
    addCommentValidator,
    getCommentsValidator,
    acceptAnswerValidator,
    toggleCommentLikeValidator
};
