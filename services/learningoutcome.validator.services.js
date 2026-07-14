import { body, param } from "express-validator";

const createCourseLearningOutcomeValidator = () => [
    body("outcomeDescription")
        .notEmpty().withMessage("Outcome description is required")
        .isString().withMessage("Outcome description must be a string")
        .isLength({ min: 5 }).withMessage("Outcome description must be at least 5 characters long"),

    body("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid Course ID format"),
];

const updateCourseLearningOutcomeValidator = () => [
    body("courseOutcomeId")
        .notEmpty().withMessage("Course Outcome ID is required")
        .isMongoId().withMessage("Invalid Course Outcome ID format"),

    body("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid Course ID format"),

    body("outcomeDescription")
        .notEmpty().withMessage("Outcome description is required")
        .isString().withMessage("Outcome description must be a string"),
];

const deleteCourseLearningOutcomeValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid Course ID format"),

    param("courseOutcomeId")
        .notEmpty().withMessage("Course Outcome ID is required")
        .isMongoId().withMessage("Invalid Course Outcome ID format"),
];

const getAllCourseLearningOutcomeValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid Course ID format"),
];

export {
    createCourseLearningOutcomeValidator,
    updateCourseLearningOutcomeValidator,
    deleteCourseLearningOutcomeValidator,
    getAllCourseLearningOutcomeValidator
};
