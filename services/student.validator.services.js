import {body} from 'express-validator'
const updateStudentInformationValidator = () => [
  body("bio")
    .optional()
    .isLength({ min: 20, max: 100 }).withMessage("Bio must be 20–100 characters")
    .trim(),

  body("phoneNumber")
    .optional()
    .matches(/^\+[1-9]\d{7,14}$/).withMessage("Phone number must be in international format (e.g., +923001234567)")
    .trim(),


  body("parentPhoneNumber")
    .optional()
    .matches(/^\+[1-9]\d{7,14}$/).withMessage("Parent phone number must be in international format")
    .trim(),

  body("grade")
    .optional()
    .isLength({ min: 1, max: 10 }).withMessage("Grade must be between 1–10 characters")
    .trim(),
];

export {updateStudentInformationValidator}