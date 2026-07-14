import { body, param } from "express-validator";

const createRoleValidator = () => [
    body("name")
        .notEmpty().withMessage("Role name is required")
        .isString().withMessage("Role name must be a string")
        .isLength({ min: 3 }).withMessage("Role name must be at least 3 characters long"),

    body("permissions")
        .optional()
        .isArray().withMessage("Permissions must be an array of strings"),

    body("permissions.*")
        .optional()
        .isString().withMessage("Each permission must be a string")
];

const getSingleRoleValidator = () => [
    param("id")
        .optional()
        .isMongoId().withMessage("Invalid role ID format"),
    body("name")
        .optional()
        .isString().withMessage("Role name must be a string")
];
const updateRoleValidator = () => [
    body("id")
        .notEmpty().withMessage("Role ID is required")
        .isMongoId().withMessage("Invalid role ID format"),
    body("name")
        .optional()
        .isString().withMessage("Role name must be a string"),
    body("permissions")
        .optional()
        .isArray().withMessage("Permissions must be an array of strings"),
    body("permissions.*")
        .optional()
        .isString().withMessage("Each permission must be a string")
];

const deleteRoleValidator = () => [
    body("roleId")
        .notEmpty().withMessage("Role ID is required")
        .isMongoId().withMessage("Invalid role ID format")
];

export {
    createRoleValidator,
    getSingleRoleValidator,
    updateRoleValidator,
    deleteRoleValidator
};
