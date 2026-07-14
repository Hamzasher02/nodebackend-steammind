import { body, param } from "express-validator";

const createDemoSessionRequestValidator = () => [
    body("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),

    body("preferredDate")
        .notEmpty().withMessage("Preferred date is required")
        .isISO8601().withMessage("Preferred date must be a valid ISO 8601 date"),

    body("preferredTime")
        .notEmpty().withMessage("Preferred time is required")
        .isString().withMessage("Preferred time must be a string")
        .trim(),
];

const approveAndAssignInstructorValidator = () => [
    param("requestId")
        .notEmpty().withMessage("Request ID is required")
        .isMongoId().withMessage("Invalid request ID format"),

    body("instructorId")
        .notEmpty().withMessage("Instructor ID is required")
        .isMongoId().withMessage("Invalid instructor ID format"),

    body("demoSessionLink")
        .notEmpty().withMessage("Demo session link is required")
        .isString().withMessage("Demo session link must be a string")
        .isURL().withMessage("Demo session link must be a valid URL")
        .trim(),
];

const getAllDemoSessionRequestsValidator = () => [
    body("status")
        .optional()
        .isIn(['pending', 'approved', 'rejected']).withMessage("Status must be one of: pending, approved, rejected"),
];

export {
    createDemoSessionRequestValidator,
    approveAndAssignInstructorValidator,
    getAllDemoSessionRequestsValidator
};
