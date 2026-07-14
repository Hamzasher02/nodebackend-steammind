import { body, param } from "express-validator";

const createNameChangeRequestValidator = () => [
    body("firstName")
        .notEmpty().withMessage("First name is required")
        .isLength({ min: 3, max: 15 }).withMessage("First name must be 3–15 characters")
        .trim(),

    body("lastName")
        .notEmpty().withMessage("Last name is required")
        .isLength({ min: 3, max: 15 }).withMessage("Last name must be 3–15 characters")
        .trim(),

    body("reasonForCorrection")
        .notEmpty().withMessage("Reason for correction is required")
        .isLength({ min: 10, max: 40 }).withMessage("Reason must be 10–40 characters")
        .trim(),
];

const approveNameChangeRequestValidator = () => [
    param("id")
        .notEmpty().withMessage("Request id is required")
        .isMongoId().withMessage("Invalid request id"),
];

export {
    createNameChangeRequestValidator,
    approveNameChangeRequestValidator
};
