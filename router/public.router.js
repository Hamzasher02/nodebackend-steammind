import express from 'express';
import { getPublicCourses, getPublicCourseDetail } from '../controller/public.course.controller.js';

const router = express.Router();

// Public Course Display Routes (Website Visitors & Students)
router.get('/courses', getPublicCourses);
router.get('/courses/:courseId', getPublicCourseDetail);

export default router;

