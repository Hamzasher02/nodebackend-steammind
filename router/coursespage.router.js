import express from 'express';
import * as ctrl from '../controller/coursespage.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';

const router = express.Router();

// Public - Get Courses Page CMS Content
router.get('/', ctrl.getCoursesPage);

// Protected - Update Courses Page Section 1 Hero Header (Website Manager)
router.patch('/section1', authenticationMiddleware, ctrl.updateSection1);

export default router;


