import { body, param } from "express-validator";

const createLectureValidator = () => [
    body("title")
        .notEmpty().withMessage("Lecture title is required")
        .isString().withMessage("Lecture title must be a string"),
    body("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format")
];

const updateLectureTitleValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
    param("lectureId")
        .notEmpty().withMessage("Lecture ID is required")
        .isMongoId().withMessage("Invalid lecture ID format"),
    body("title")
        .notEmpty().withMessage("Lecture title is required")
        .isString().withMessage("Lecture title must be a string")
];

const getAllLecturesValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format")
];


const getSingleLectureValidator = () => [
    param("courseId")
        .notEmpty().withMessage("Course ID is required")
        .isMongoId().withMessage("Invalid course ID format"),
    param("lectureId")
        .notEmpty().withMessage("Lecture ID is required")
        .isMongoId().withMessage("Invalid lecture ID format")
];


const deleteLectureValidator = () => [
  
    param("lectureId")
        .notEmpty().withMessage("Lecture ID is required")
        .isMongoId().withMessage("Invalid lecture ID format")
];

export {
    createLectureValidator,
    updateLectureTitleValidator,
    getAllLecturesValidator,
    getSingleLectureValidator,
    deleteLectureValidator
};
