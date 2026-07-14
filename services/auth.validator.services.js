import { body, validationResult } from 'express-validator';
import { BAD_REQUEST } from '../error/error.js';

const studentRegistrationValidator = () => [
  // these are for base users both instructor and user
  body("firstName")
    .notEmpty().withMessage("First name is required")
    .isLength({ min: 3, max: 15 }).withMessage("First name must be 3–15 characters")
    .trim(),

  body("lastName")
    .notEmpty().withMessage("Last name is required")
    .isLength({ min: 3, max: 15 }).withMessage("Last name must be 3–15 characters")
    .trim(),

  body("fatherName")
    .notEmpty().withMessage("Father name is required")
    .isLength({ min: 3, max: 15 }).withMessage("Father name must be 3–15 characters")
    .trim(),

  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("dateOfBirth")
    .notEmpty().withMessage("Date of birth is required")
    .isISO8601().withMessage("Date of birth must be a valid date (YYYY-MM-DD)"),

  body("bio")
    .notEmpty().withMessage("Bio is required")
    .isLength({ min: 20, max: 100 }).withMessage("Bio must be 20–100 characters")
    .trim(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8, max: 15 }).withMessage("Password must be 8–15 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character"),

  body("phoneNumber")
    .notEmpty().withMessage("Phone number is required")
    .matches(/^\+[1-9]\d{7,14}$/).withMessage("Phone number must be in international format (e.g., +923001234567)")
    .trim(),

  body("consentAccepted")
    .notEmpty().withMessage("Consent is required")
    .isBoolean().withMessage("Consent must be true or false").toBoolean(),

  // these are for student
  body("parentPhoneNumber")
    .notEmpty().withMessage("Parent phone number is required")
    .matches(/^\+[1-9]\d{7,14}$/).withMessage("Parent phone number must be in international format")
    .trim(),

  body("age")
    .notEmpty().withMessage("Age is required")
    .toInt()
    .isInt({ min: 5, max: 100 }).withMessage("Age must be between 5–100"),

  // these are for residence
  body("address")
    .notEmpty().withMessage("Address is required")
    .isLength({ min: 3, max: 50 }).withMessage("Address must be 3–50 characters")
    .trim(),

  body("city")
    .notEmpty().withMessage("City is required")
    .isLength({ min: 3, max: 15 }).withMessage("City must be 3–15 characters")
    .trim(),

  body("country")
    .notEmpty().withMessage("Country is required")
    .isLength({ min: 2, max: 25 }).withMessage("Country must be 2–25 characters")
    .trim(),

  body("postalCode")
    .notEmpty().withMessage("Postal code is required")
    .toInt() // 
    .isInt({ min: 100, max: 999999999 }).withMessage("Postal code must be between 100–999999999"),

  // these are for emergency
  body("fullName")
    .notEmpty().withMessage("Emergency contact name is required")
    .isLength({ min: 3, max: 50 }).withMessage("Emergency contact name must be 3–50 characters")
    .trim(),

  body("relationship")
    .notEmpty().withMessage("Relationship is required")
    .isLength({ min: 3, max: 15 }).withMessage("Relationship must be 3–15 characters")
    .trim(),

  body("emergencyPhoneNumber")
    .notEmpty().withMessage("Emergency phone number is required")
    .matches(/^\+[1-9]\d{7,14}$/).withMessage("Emergency phone must be in international format (e.g., +923001234567)")
    .trim(),
];
const loginValidator = () => [

  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("password")
    .notEmpty().withMessage("Password is required")];

const instructorRegistrationValidator = () => [
  // base user 
  body("firstName")
    .notEmpty().withMessage("First name is required")
    .isLength({ min: 3, max: 15 }).withMessage("First name must be 3–15 characters")
    .trim(),

  body("lastName")
    .notEmpty().withMessage("Last name is required")
    .isLength({ min: 3, max: 15 }).withMessage("Last name must be 3–15 characters")
    .trim(),

  body("fatherName")
    .notEmpty().withMessage("Father name is required")
    .isLength({ min: 3, max: 15 }).withMessage("Father name must be 3–15 characters")
    .trim(),

  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8, max: 15 }).withMessage("Password must be 8–15 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character"),

  body("phoneNumber")
    .notEmpty().withMessage("Phone number is required")
    .matches(/^\+[1-9]\d{7,14}$/).withMessage("Phone number must be in international format (e.g., +923001234567)")
    .trim(),

  body("dateOfBirth")
    .notEmpty().withMessage("Date of birth is required")
    .isISO8601().withMessage("Date of birth must be a valid date (YYYY-MM-DD)"),

  body("bio")
    .notEmpty().withMessage("Bio is required")
    .isLength({ min: 20, max: 100 }).withMessage("Bio must be 20–100 characters")
    .trim(),

  body("consentAccepted")
    .notEmpty().withMessage("Consent is required")
    .isBoolean().withMessage("Consent must be true or false"),

  // instructor residence
  body("address")
    .notEmpty().withMessage("Address is required")
    .isLength({ min: 3, max: 50 }).withMessage("Address must be 3–50 characters")
    .trim(),

  body("city")
    .notEmpty().withMessage("City is required")
    .isLength({ min: 3, max: 15 }).withMessage("City must be 3–15 characters")
    .trim(),

  body("country")
    .notEmpty().withMessage("Country is required")
    .isLength({ min: 2, max: 2 }).withMessage("Country must be 2–25 characters")
    .trim(),

  body("postalCode")
    .notEmpty().withMessage("Postal code is required")
    .toInt()
    .isInt({ min: 100, max: 999999999 }).withMessage("Postal code must be between 100–999999999"),

  // emergency
  body("fullName")
    .notEmpty().withMessage("Emergency contact name is required")
    .isLength({ min: 3, max: 50 }).withMessage("Emergency contact name must be 3–50 characters")
    .trim(),

  body("relationship")
    .notEmpty().withMessage("Relationship is required")
    .isLength({ min: 3, max: 15 }).withMessage("Relationship must be 3–15 characters")
    .trim(),

  body("emergencyPhoneNumber")
    .notEmpty().withMessage("Emergency phone number is required")
    .matches(/^\+[1-9]\d{7,14}$/).withMessage("Emergency phone must be in international format (e.g., +923001234567)")
    .trim(),

  body("coursePreferences").isArray({min:1,max:5}).withMessage("it must be array or min of 1 and max 5 courses are allowed is allowed"),
  body("qualification")
    .notEmpty().withMessage("Qualification is required")
    .isLength({ min: 2, max: 50 }).withMessage("Qualification must be 2–50 characters"),

  body("degreeTitle")
    .notEmpty().withMessage("Degree title is required")
    .isLength({ min: 2, max: 50 }).withMessage("Degree title must be 2–50 characters"),

  body("graduationYear")
    .notEmpty().withMessage("Graduation year is required")
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage("Graduation year must be a valid year"),

  body("totalMarks")
    .notEmpty().withMessage("Total marks are required")
    .isNumeric({ min: 1 }).withMessage("Total marks must be greater than 0"),

  body("obtainedMarks")
    .notEmpty().withMessage("Obtained marks are required")
    .isNumeric({ min: 0 }).withMessage("Obtained marks must be a valid number"),

  body("institution")
    .notEmpty().withMessage("Institution name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Institution name must be 2–100 characters")
];
const otpValidator = () => [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email"),

  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isInt({ min: 1000, max: 9999 }).withMessage("OTP must be a 4-digit number")
]
const staffRegisterationValidator = () => [
  body("firstName")
    .notEmpty().withMessage("First name is required")
    .isLength({ min: 3, max: 15 }).withMessage("First name must be 3–15 characters")
    .trim(),

  body("lastName")
    .notEmpty().withMessage("Last name is required")
    .isLength({ min: 3, max: 15 }).withMessage("Last name must be 3–15 characters")
    .trim(),
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8, max: 15 }).withMessage("Password must be 8–15 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character"),
]
const staffLoginValidator = () => [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8, max: 15 }).withMessage("Password must be 8–15 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[\W_]/).withMessage("Password must contain at least one special character"),
]
function validationMiddleware(req, res, next) {

  const errors = validationResult(req)
  if (errors.isEmpty()) return next()
  const allError = errors.errors.map(({ msg }) => msg).join(',')

  next(new BAD_REQUEST(allError))
}

/**
 * ===============================================
 * PASSWORD CHANGE VALIDATOR - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 27, 2025
 * Time: 10:50 AM
 * Purpose: Universal password change validation for Student and Admin
 * Lines Modified: 271-297 (NEW FUNCTION ADDED)
 * ===============================================
 */
const changePasswordValidator = () => [
  // Validate current password field - ensures user provides their existing password
  body("currentPassword")
    .notEmpty().withMessage("Current password is required")  // Must not be empty
    .trim(),  // Remove whitespace

  // Validate new password field - ensures strong password requirements
  body("newPassword")
    .notEmpty().withMessage("New password is required")  // Must not be empty
    .isLength({ min: 8, max: 15 }).withMessage("New password must be 8–15 characters")  // Length validation
    .matches(/[A-Za-z]/).withMessage("New password must contain at least one letter")  // Must have letters
    .matches(/\d/).withMessage("New password must contain at least one number")  // Must have numbers
    .matches(/[\W_]/).withMessage("New password must contain at least one special character")  // Must have special chars
    .trim(),  // Remove whitespace

  // Validate confirm password field - ensures both passwords match
  body("confirmNewPassword")
    .notEmpty().withMessage("Confirm new password is required")  // Must not be empty
    .custom((value, { req }) => {  // Custom validation function
      if (value !== req.body.newPassword) {  // Check if confirm password matches new password
        throw new Error("Confirm password does not match new password");  // Throw error if no match
      }
      return true;  // Return true if passwords match
    })
    .trim()  // Remove whitespace
];


const forgotPasswordValidator = () => [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email format")
    .normalizeEmail(),
];


const resetPasswordWithOtpValidator = () => [
  body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),

  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isInt().withMessage("OTP must be a number"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8, max: 15 }).withMessage("New password must be 8–15 characters")
    .matches(/[A-Za-z]/).withMessage("New password must contain at least one letter")
    .matches(/\d/).withMessage("New password must contain at least one number")
    .matches(/[\W_]/).withMessage("New password must contain at least one special character")
    .trim(),

  body("confirmNewPassword")
    .notEmpty().withMessage("Please confirm your new password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];
export { studentRegistrationValidator, instructorRegistrationValidator, staffRegisterationValidator, loginValidator, staffLoginValidator, validationMiddleware, otpValidator, changePasswordValidator,forgotPasswordValidator,resetPasswordWithOtpValidator };
