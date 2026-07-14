import { body, param } from 'express-validator';

/**
 * ===============================================
 * INSTRUCTOR VALIDATOR SERVICES - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: 2025
 * Purpose: Validation middleware for instructor-related operations
 * ===============================================
 */

/**
 * Validator for updating instructor personal information
 * Created by: Hamza Sher
 */
export const updateInstructorInformationValidator = () => [
    body("firstName")
        .optional()
        .isLength({ min: 3, max: 15 }).withMessage("First name must be 3–15 characters")
        .trim(),

    body("lastName")
        .optional()
        .isLength({ min: 3, max: 15 }).withMessage("Last name must be 3–15 characters")
        .trim(),

    body("fatherName")
        .optional()
        .isLength({ min: 3, max: 15 }).withMessage("Father name must be 3–15 characters")
        .trim(),

    body("phoneNumber")
        .optional()
        .matches(/^\+[1-9]\d{7,14}$/).withMessage("Phone number must be in international format (e.g., +923001234567)")
        .trim(),

    body("email")
        .optional()
        .isEmail().withMessage("Invalid email format")
        .normalizeEmail(),

    body("dateOfBirth")
        .optional()
        .isISO8601().withMessage("Date of birth must be a valid date (YYYY-MM-DD)"),

    body("bio")
        .optional()
        .isLength({ min: 20, max: 100 }).withMessage("Bio must be 20–100 characters")
        .trim(),

    // Residence Information
    body("address")
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage("Address must be 3–50 characters")
        .trim(),

    body("city")
        .optional()
        .isLength({ min: 3, max: 15 }).withMessage("City must be 3–15 characters")
        .trim(),

    body("country")
        .optional()
        .isLength({ min: 2, max: 25 }).withMessage("Country must be 2–25 characters")
        .trim(),

    body("postalCode")
        .optional()
        .toInt()
        .isInt({ min: 100, max: 999999999 }).withMessage("Postal code must be between 100–999999999"),

    // Emergency Contact Information
    body("emergencyFullName")
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage("Emergency contact name must be 3–50 characters")
        .trim(),

    body("emergencyRelationship")
        .optional()
        .isLength({ min: 3, max: 15 }).withMessage("Relationship must be 3–15 characters")
        .trim(),

    body("emergencyPhoneNo")
        .optional()
        .matches(/^\+[1-9]\d{7,14}$/).withMessage("Emergency phone must be in international format (e.g., +923001234567)")
        .trim(),
];

/**
 * Validator for updating instructor academic details
 * Created by: Hamza Sher
 */
export const updateInstructorAcademicValidator = () => [
    body("qualification")
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage("Qualification must be 2–50 characters"),

    body("degreeTitle")
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage("Degree title must be 2–50 characters"),

    body("graduationYear")
        .optional()
        .isInt({ min: 1950, max: new Date().getFullYear() })
        .withMessage("Graduation year must be a valid year"),

    body("totalMarks")
        .optional()
        .isNumeric({ min: 1 }).withMessage("Total marks must be greater than 0"),

    body("obtainedMarks")
        .optional()
        .isNumeric({ min: 0 }).withMessage("Obtained marks must be a valid number"),

    body("institution")
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage("Institution name must be 2–100 characters")
];

/**
 * Validator for changing instructor password
 * Created by: Hamza Sher
 */
export const changePasswordValidator = () => [
    body("currentPassword")
        .notEmpty().withMessage("Current password is required")
        .trim(),

    body("newPassword")
        .notEmpty().withMessage("New password is required")
        .isLength({ min: 8, max: 15 }).withMessage("New password must be 8–15 characters")
        .matches(/[A-Za-z]/).withMessage("New password must contain at least one letter")
        .matches(/\d/).withMessage("New password must contain at least one number")
        .matches(/[\W_]/).withMessage("New password must contain at least one special character")
        .trim(),

    body("confirmNewPassword")
        .notEmpty().withMessage("Confirm new password is required")
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error("Confirm password does not match new password");
            }
            return true;
        })
        .trim()
];


//hamza hanif 11 13 25 
const getInstructorsThatAreAssignedToACourseValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
];

const getInstructorsThatCanBeAssignedToACourseValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
];

// 11 27 25 
//hamza hanif
const requestNewTranscriptValidator = () => [
    body("instructorId")
        .notEmpty().withMessage("Instructor ID is required")
        .isMongoId().withMessage("Invalid instructor ID format"),
];
const verifyInstructorTranscriptValidator = () => [
    body("instructorId")
        .notEmpty().withMessage("Instructor ID is required")
        .isMongoId().withMessage("Invalid instructor ID format"),
];
export {
    requestNewTranscriptValidator,
    verifyInstructorTranscriptValidator,
    getInstructorsThatAreAssignedToACourseValidator,
    getInstructorsThatCanBeAssignedToACourseValidator,
};
