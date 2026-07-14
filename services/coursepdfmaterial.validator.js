import { body, param } from "express-validator";

const createPdfValidator = () => [
    body("title")
        .notEmpty().withMessage("PDF title is required")
        .isString().withMessage("PDF title must be a string"),
    body("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
];

const updatePdfTitleValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
    param("pdfId")
        .notEmpty().withMessage("PDF ID is required")
        .isMongoId().withMessage("Invalid PDF ID format"),
    body("title")
        .notEmpty().withMessage("PDF title is required")
        .isString().withMessage("PDF title must be a string"),
];

const getAllPdfsValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
];

const getSinglePdfValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
    param("pdfId")
        .notEmpty().withMessage("PDF ID is required")
        .isMongoId().withMessage("Invalid PDF ID format"),
];

const deletePdfValidator = () => [
    param("pdfId")
        .notEmpty().withMessage("PDF ID is required")
        .isMongoId().withMessage("Invalid PDF ID format"),
];

export {
    createPdfValidator,
    updatePdfTitleValidator,
    getAllPdfsValidator,
    getSinglePdfValidator,
    deletePdfValidator
};
