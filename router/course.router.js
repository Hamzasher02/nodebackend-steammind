import express from 'express';
import {
    createCourse,
    getAllCoursesAdminSideWhileCreatingBundle,
    getSingleCourseAdminSide,
    updateCourseBasicInformation,
    toggleCourseVisibility,
    publishCourse,
    assignInstructorToACourse,
    removeAssignedInstructor,
    deleteCourse,
    getCourseCompletion,
    getAdminCatalog
} from '../controller/course.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import { uploadTwoFiles } from '../middleware/multer.middleware.js';

const router = express.Router();

// Protected Course Management Routes (Admin / Staff)
router.post('/', authenticationMiddleware, uploadTwoFiles, createCourse);
router.get('/', authenticationMiddleware, getAllCoursesAdminSideWhileCreatingBundle);
router.get('/catalog', authenticationMiddleware, getAdminCatalog);
router.get('/:courseId', authenticationMiddleware, getSingleCourseAdminSide);
router.patch('/:courseId', authenticationMiddleware, uploadTwoFiles, updateCourseBasicInformation);
router.patch('/:courseId/visibility', authenticationMiddleware, toggleCourseVisibility);
router.patch('/:courseId/publish', authenticationMiddleware, publishCourse);
router.post('/:courseId/instructors', authenticationMiddleware, assignInstructorToACourse);
router.delete('/:courseId/instructors/:instructorId', authenticationMiddleware, removeAssignedInstructor);
router.delete('/:courseId', authenticationMiddleware, deleteCourse);
router.get('/:courseId/completion', authenticationMiddleware, getCourseCompletion);

export default router;

