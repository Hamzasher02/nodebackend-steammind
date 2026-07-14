import { body, param, query } from "express-validator";

const createBundleValidator = () => [
    body("bundleName")
        .notEmpty().withMessage("Bundle name is required")
        .isLength({ min: 3, max: 50 }).withMessage("Bundle name must be between 3 and 50 characters"),
    body("price")
        .notEmpty().withMessage("Price is required")
        .isNumeric().withMessage("Price must be a number"),
    body("category")
        .notEmpty().withMessage("Category is required")
        .isMongoId().withMessage("Invalid category ID"),
    body("ageGroup")
        .notEmpty().withMessage("Age group is required"),
    body("level")
        .notEmpty().withMessage("Level is required"),
    body("access")
        .notEmpty().withMessage("Access is required")
        .isNumeric().withMessage("Access must be a number"),
    body("courses")
        .isArray({ min: 1 }).withMessage("Courses must be an array with at least one course"),
    body("visibility")
        .optional(),
    body("discount")
        .optional()
        .isNumeric().withMessage("Discount must be a number"),
    body("priceAfterDiscount")
        .optional()
        .isNumeric().withMessage("Price after discount must be a number")
];

const updateBundleValidator = () => [
    param("id")
        .notEmpty().withMessage("Bundle ID is required")
        .isMongoId().withMessage("Invalid bundle ID"),
    body("bundleName")
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage("Bundle name must be between 3 and 50 characters"),
    body("price")
        .optional()
        .isNumeric().withMessage("Price must be a number"),
    body("category")
        .optional()
        .isMongoId().withMessage("Invalid category ID"),
    body("ageGroup")
        .optional(),
    body("level")
        .optional(),
    body("access")
        .optional()
        .isNumeric().withMessage("Access must be a number"),
    body("courses")
        .optional()
        .isArray().withMessage("Courses must be an array"),
    body("visibility")
        .optional(),
    body("discount")
        .optional()
        .isNumeric().withMessage("Discount must be a number"),
    body("priceAfterDiscount")
        .optional()
        .isNumeric().withMessage("Price after discount must be a number")
];

const getSingleBundleValidator = () => [
    param("id")
        .notEmpty().withMessage("Bundle ID is required")
        .isMongoId().withMessage("Invalid bundle ID")
];

const deleteOrRestoreBundleValidator = () => [
    param("id")
        .notEmpty().withMessage("Bundle ID is required")
        .isMongoId().withMessage("Invalid bundle ID")
];

const getBundleQueryValidator = () => [
    query("category")
        .optional()
        .isMongoId().withMessage("Invalid category ID"),
    query("level")
        .optional(),
    query("ageGroup")
        .optional(),
    query("visibility")
        .optional()
];

export {
    createBundleValidator,
    updateBundleValidator,
    getSingleBundleValidator,
    deleteOrRestoreBundleValidator,
    getBundleQueryValidator
};
