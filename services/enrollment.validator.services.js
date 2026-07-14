import { body, param } from "express-validator";

const createEnrollmentValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),

    body("enrollmentType")
        .notEmpty().withMessage("Enrollment type is required")
        .isIn(['Live Classes', 'Recorded Lectures']).withMessage("Enrollment type must be either 'Live Classes' or 'Recorded Lectures'"),

    body("preferredClassTime")
        .if(body("enrollmentType").equals("Live Classes"))
        .notEmpty().withMessage("Preferred class time is required for Live Classes")
        .isString().withMessage("Preferred class time must be a string")
        .trim(),

    body("invoiceNumber")
        .optional()
        .isString().withMessage("Invoice number must be a string")
        .trim()
];

const getEnrollmentValidator = () => [
    param("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format")
];

const getUserEnrollmentsValidator = () => [
    // No validation needed, uses authenticated user from JWT
];

const getCourseEnrollmentsValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format")
];

const approveEnrollmentValidator = () => [
    param("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format")
];

const rejectEnrollmentValidator = () => [
    param("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format"),

    body("rejectReason")
        .notEmpty().withMessage("Reject reason is required")
        .isString().withMessage("Reject reason must be a string")
        .trim()
        .isLength({ min: 5, max: 500 }).withMessage("Reject reason must be between 5 and 500 characters")
];

const getEnrolledCourseDataValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format")
];

const getModuleDetailsValidator = () => [
    param("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format"),

    param("moduleId")
        .notEmpty().withMessage("Module ID is required")
        .isMongoId().withMessage("Invalid module ID format")
];

const getLectureDetailValidator = () => [
    param("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format"),

    param("moduleId")
        .notEmpty().withMessage("Module ID is required")
        .isMongoId().withMessage("Invalid module ID format"),

    param("lectureId")
        .notEmpty().withMessage("Lecture ID is required")
        .isMongoId().withMessage("Invalid lecture ID format")
];

const getPdfDetailValidator = () => [
    param("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format"),

    param("moduleId")
        .notEmpty().withMessage("Module ID is required")
        .isMongoId().withMessage("Invalid module ID format"),

    param("pdfId")
        .notEmpty().withMessage("PDF ID is required")
        .isMongoId().withMessage("Invalid PDF ID format")
];

export {
    createEnrollmentValidator,
    getEnrollmentValidator,
    getUserEnrollmentsValidator,
    getCourseEnrollmentsValidator,
    approveEnrollmentValidator,
    rejectEnrollmentValidator,
    getEnrolledCourseDataValidator,
    getModuleDetailsValidator,
    getLectureDetailValidator,
    getPdfDetailValidator
};
