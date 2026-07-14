import { body, param } from "express-validator";

const createCourseModuleValidator = () => [
  body("courseId")
    .notEmpty().withMessage("Course ID is required")
    .isMongoId().withMessage("Invalid Course ID format"),

  body("moduleName")
    .notEmpty().withMessage("Module name is required")
    .isString().withMessage("Module name must be a string")
    .isLength({ min: 3, max: 100 })
    .withMessage("Module name must be between 3 and 100 characters"),

  body("moduleDescription")
    .optional({ checkFalsy: true })
    .isString().withMessage("Module description must be a string")
    .isLength({ min: 3, max: 300 })
    .withMessage("Module description must be between 3 and 300 characters"),

  body("noOfSession")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("Number of sessions must be a positive integer"),

  body("sessionDuration")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage("Session duration must be a positive integer (in minutes)"),
];

const updateCourseModuleValidator = () => [
  param("courseId")
    .notEmpty().withMessage("Course ID is required")
    .isMongoId().withMessage("Invalid Course ID format"),
  param("courseModuleId")
    .notEmpty().withMessage("Course Module ID is required")
    .isMongoId().withMessage("Invalid Course Module ID format"),
  body("moduleName")
    .optional({ checkFalsy: true })
    .isString().withMessage("Module name must be a string")
    .isLength({ min: 3, max: 100 })
    .withMessage("Module name must be between 3 and 100 characters"),

  body("moduleDescription")
    .optional({ checkFalsy: true })
    .isString().withMessage("Module description must be a string")
    .isLength({ min: 3, max: 300 })
    .withMessage("Module description must be between 3 and 300 characters"),

  body("noOfSession")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("Number of sessions must be a positive integer"),

  body("sessionDuration")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("Session duration must be a positive integer (in minutes)"),
];


const deleteCourseModuleValidator = () => [
  param("courseModuleId")
    .notEmpty().withMessage("Course ID is required")
    .isMongoId().withMessage("Invalid Course ID format"),

  
];

export { createCourseModuleValidator,updateCourseModuleValidator,deleteCourseModuleValidator };
