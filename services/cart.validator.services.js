import { body, param } from "express-validator";

const addToCartValidator = () => [
    body("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),

    body("purchaseType")
        .optional()
        .isIn(['Live Classes', 'Recorded Lectures']).withMessage("Purchase type must be 'Live Classes' or 'Recorded Lectures'"),

    body("quantity")
        .optional()
        .isInt({ min: 1 }).withMessage("Quantity must be a positive integer (minimum 1)")
        .toInt()
];

const updateQuantityValidator = () => [
    param("itemId")
        .notEmpty().withMessage("Cart item ID is required")
        .trim()
        .isMongoId().withMessage("Invalid cart item ID format"),
    
    body("quantity")
        .notEmpty().withMessage("Quantity is required")
        .isInt({ min: 1 }).withMessage("Quantity must be a positive integer (minimum 1)")
        .toInt()
];

const removeItemValidator = () => [
    param("itemId")
        .notEmpty().withMessage("Cart item ID is required")
        .trim()
        .isMongoId().withMessage("Invalid cart item ID format")
];

export {
    addToCartValidator,
    updateQuantityValidator,
    removeItemValidator
};
