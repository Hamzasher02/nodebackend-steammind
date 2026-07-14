import express from 'express'
import { getPublicCourses, getPublicCourseDetail } from '../controller/public.course.controller.js'
import activityLogger from '../middleware/activitylogger.middleware.js'
import { getPublicCourses as noop } from '../controller/public.course.controller.js'

const router = express.Router()

// Public courses listing
router.get('/courses',
    activityLogger("PUBLIC_COURSE", "Get public courses listing"),
    getPublicCourses
)

// Public course detail
router.get('/courses/:courseId',
    activityLogger("PUBLIC_COURSE", "Get public course detail"),
    getPublicCourseDetail
)

export default router
