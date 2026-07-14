import { body, param, query } from "express-validator";

const createCourseFeedbackValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),

    body("feedbackText")
        .notEmpty().withMessage("Feedback text is required")
        .isString().withMessage("Feedback text must be a string")
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage("Feedback text must be between 10 and 2000 characters"),

    body("rating")
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5")
];

const getCourseFeedbacksValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format")
];

const getSingleFeedbackValidator = () => [
    param("feedbackId")
        .notEmpty().withMessage("Feedback ID is required")
        .isMongoId().withMessage("Invalid feedback ID format")
];

const getUserCourseFeedbackValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format")
];

const updateCourseFeedbackValidator = () => [
    param("feedbackId")
        .notEmpty().withMessage("Feedback ID is required")
        .isMongoId().withMessage("Invalid feedback ID format"),

    body("feedbackText")
        .optional()
        .isString().withMessage("Feedback text must be a string")
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage("Feedback text must be between 10 and 2000 characters"),

    body("rating")
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5")
];

const deleteCourseFeedbackValidator = () => [
    param("feedbackId")
        .notEmpty().withMessage("Feedback ID is required")
        .isMongoId().withMessage("Invalid feedback ID format")
];

const getAllFeedbacksValidator = () => [
    query("courseId")
        .optional()
        .isMongoId().withMessage("Invalid course ID format")
];

export {
    createCourseFeedbackValidator,
    getCourseFeedbacksValidator,
    getSingleFeedbackValidator,
    getUserCourseFeedbackValidator,
    updateCourseFeedbackValidator,
    deleteCourseFeedbackValidator,
    getAllFeedbacksValidator
};
