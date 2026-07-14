import { body, param } from "express-validator";

const createCourseValidator = () => [
    body("courseTitle")
        .trim()
        .notEmpty().withMessage("Course title is required")
        .isString().withMessage("Course title must be a string"),

    body("courseCategory")
        .trim()
        .notEmpty().withMessage("Course category is required")
        .isString().withMessage("Course category must be a string"),

    body("courseEnrollementType")
        .trim()
        .toLowerCase()
        .notEmpty().withMessage("Course enrollment type is required")
        .isString().withMessage("Course enrollment type must be a string")
        .isIn(["live", "recorded"])
        .withMessage("Course enrollment type must be either 'live' or 'recorded'"),

    body("courseSubCategory")
        .trim()
        .notEmpty().withMessage("Course subcategory is required")
        .isString().withMessage("Subcategory must be a string"),

    body("courseLevel")
        .trim()
        .notEmpty().withMessage("Course level is required")
        .isString().withMessage("Level must be a string"),

    body("courseAgeGroup")
        .trim()
        .notEmpty().withMessage("Course age group is required")
        .isString().withMessage("Age group must be a string"),
];



const updateCourseValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),

    body("courseTitle")
        .optional()
        .isString().withMessage("Course title must be a string")
        .isLength({ min: 10, max: 100 }).withMessage("Course title must be between 10 and 100 characters"),

    body("courseCategory")
        .optional()
        .isString().withMessage("Course category must be a string"),

    body("courseSubCategory")
        .optional()
        .isString().withMessage("Course subcategory must be a string"),

    body("courseLevel")
        .optional()
        .isString().withMessage("Course level must be a string"),

    body("courseAgeGroup")
        .optional()
        .isString().withMessage("Course age group must be a string"),

    body("courseAccess")
        .optional()
        .isString().withMessage("Course access must be a string"),

    body("coursePrice")
        .optional()
        .isString().withMessage("Course price must be a string"),
    body("courseOverview")
        .optional()
        .isObject().withMessage("Course overview must be an object"),

    body("courseOverview.courseDescription")
        .optional()
        .isString().withMessage("Course description must be a string"),

    body("courseOverview.courseDuration")
        .optional()
        .isString().withMessage("Course duration must be a string"),

    body("courseOverview.coursePrerequisite")
        .optional()
        .isString().withMessage("Course prerequisite must be a string"),

    body("courseOverview.courseTargetAudience")
        .optional()
        .isString().withMessage("Target audience must be a string"),
];

const publishCourseValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
];

const toggleCourseVisibilityValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
];

const assignInstructorValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),

    body("instructorId")
        .notEmpty().withMessage("Instructor ID is required")
        .isMongoId().withMessage("Invalid instructor ID format"),
];

const removeAssignedInstructorValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),

    body("instructorId")
        .notEmpty().withMessage("Instructor ID is required")
        .isMongoId().withMessage("Invalid instructor ID format"),
];
const getSingleCourseValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
];
export {
    createCourseValidator,
    updateCourseValidator,
    getSingleCourseValidator,
    publishCourseValidator,
    toggleCourseVisibilityValidator,
    assignInstructorValidator,
    removeAssignedInstructorValidator,
};



