import { body, param, query } from "express-validator";

const createCourseSessionValidator = () => [
    body("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format"),

    body("instructorId")
        .notEmpty().withMessage("Instructor ID is required")
        .isMongoId().withMessage("Invalid instructor ID format"),

    body("sessionDate")
        .notEmpty().withMessage("Session date is required")
        .isString().withMessage("Session date must be a string")
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Session date must be in format YYYY-MM-DD"),

    body("startTime")
        .notEmpty().withMessage("Start time is required")
        .isString().withMessage("Start time must be a string")
        .matches(/^\d{2}:\d{2}$/).withMessage("Start time must be in format HH:MM"),

    body("endTime")
        .notEmpty().withMessage("End time is required")
        .isString().withMessage("End time must be a string")
        .matches(/^\d{2}:\d{2}$/).withMessage("End time must be in format HH:MM"),

    body("sessionNumber")
        .notEmpty().withMessage("Session number is required")
        .isInt({ min: 1 }).withMessage("Session number must be a positive integer"),

    body("totalSessions")
        .notEmpty().withMessage("Total sessions is required")
        .isInt({ min: 1 }).withMessage("Total sessions must be a positive integer"),

    body("sessionLink")
        .optional()
        .isString().withMessage("Session link must be a string")
        .isURL().withMessage("Session link must be a valid URL"),

    body("notes")
        .optional()
        .isString().withMessage("Notes must be a string")
        .trim()
];

const getSingleSessionValidator = () => [
    param("sessionId")
        .notEmpty().withMessage("Session ID is required")
        .isMongoId().withMessage("Invalid session ID format")
];

const getSessionsByEnrollmentValidator = () => [
    param("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format")
];

const getCourseSessionsByCourseValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),

    query("sessionStatus")
        .optional()
        .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
        .withMessage("Invalid session status"),

    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100")
];

const getSessionsCountByCourseValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format")
];

const updateCourseSessionValidator = () => [
    param("sessionId")
        .notEmpty().withMessage("Session ID is required")
        .isMongoId().withMessage("Invalid session ID format"),

    body("sessionDate")
        .optional()
        .isString().withMessage("Session date must be a string")
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Session date must be in format YYYY-MM-DD"),

    body("startTime")
        .optional()
        .isString().withMessage("Start time must be a string")
        .matches(/^\d{2}:\d{2}$/).withMessage("Start time must be in format HH:MM"),

    body("endTime")
        .optional()
        .isString().withMessage("End time must be a string")
        .matches(/^\d{2}:\d{2}$/).withMessage("End time must be in format HH:MM"),

    body("sessionLink")
        .optional()
        .isString().withMessage("Session link must be a string")
        .isURL().withMessage("Session link must be a valid URL"),

    body("notes")
        .optional()
        .isString().withMessage("Notes must be a string")
        .trim(),

    body("sessionStatus")
        .optional()
        .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
        .withMessage("Invalid session status")
];

const deleteCourseSessionValidator = () => [
    param("sessionId")
        .notEmpty().withMessage("Session ID is required")
        .isMongoId().withMessage("Invalid session ID format")
];

const getAllCourseSessionsValidator = () => [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

    query("courseId")
        .optional()
        .isMongoId().withMessage("Invalid course ID format"),

    query("enrollmentId")
        .optional()
        .isMongoId().withMessage("Invalid enrollment ID format"),

    query("sessionStatus")
        .optional()
        .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
        .withMessage("Invalid session status")
];

const getStudentSessionsValidator = () => [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

    query("courseId")
        .optional()
        .isMongoId().withMessage("Invalid course ID format"),

    query("sessionStatus")
        .optional()
        .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
        .withMessage("Invalid session status")
];

const getInstructorSessionsValidator = () => [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

    query("sessionStatus")
        .optional()
        .isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
        .withMessage("Invalid session status")
];

const getStudentSessionsByEnrollmentValidator = () => [
    param("enrollmentId")
        .notEmpty().withMessage("Enrollment ID is required")
        .isMongoId().withMessage("Invalid enrollment ID format")
];

const markModuleCompleteValidator = () => [
    param("sessionId")
        .notEmpty().withMessage("Session ID is required")
        .isMongoId().withMessage("Invalid session ID format"),

    param("moduleId")
        .notEmpty().withMessage("Module ID is required")
        .isMongoId().withMessage("Invalid module ID format"),

    body("notes")
        .optional()
        .isString().withMessage("Notes must be a string")
        .trim()
        .isLength({ max: 500 }).withMessage("Notes must not exceed 500 characters")
];

const getSessionDetailWithModulesValidator = () => [
    param("sessionId")
        .notEmpty().withMessage("Session ID is required")
        .isMongoId().withMessage("Invalid session ID format")
];

export {
    createCourseSessionValidator,
    getSingleSessionValidator,
    getSessionsByEnrollmentValidator,
    getCourseSessionsByCourseValidator,
    getSessionsCountByCourseValidator,
    updateCourseSessionValidator,
    deleteCourseSessionValidator,
    getAllCourseSessionsValidator,
    getStudentSessionsValidator,
    getInstructorSessionsValidator,
    getStudentSessionsByEnrollmentValidator,
    markModuleCompleteValidator,
    getSessionDetailWithModulesValidator
};
