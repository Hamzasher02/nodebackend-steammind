import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import { uploadLectureVideo } from '../middleware/multer.middleware.js';
import {
    createLecture,
    updateLectureTitle,
    getAllLectures,
    getSingleLecture,
    deleteLecture,
    restoreLecture,
    getAllLecturesByModule,
    getAllLecturesStudentSideModuleWise,
    getSingleLectureStudentSide,
    deleteLecturePermanently
} from '../controller/courselecture.controller.js';
import {
    createLectureValidator,
    deleteLectureValidator,
    getAllLecturesValidator,
    getSingleLectureValidator,
    updateLectureTitleValidator
} from '../services/courselecture.validator.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import { deleteCategoryPermanently } from '../controller/category.controller.js';

const router = express.Router();

router.post(
    '/uploadCourseLecture',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'write'),
    uploadLectureVideo,
    createLectureValidator(),
    validationMiddleware,
    activityLogger("COURSE_LECTURE", "Upload course lecture request"),
    createLecture
);

router.patch(
    '/updateLectureTitle/:courseId/:lectureId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'update'),
    updateLectureTitleValidator(),
    validationMiddleware,
    activityLogger("COURSE_LECTURE", "Update lecture title request"),
    updateLectureTitle
);

router.get(
    '/getAllLectures/:courseId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'read'),
    getAllLecturesValidator(),
    validationMiddleware,
    activityLogger("COURSE_LECTURE", "Get all lectures request"),
    getAllLectures
);

router.get(
    '/getSingleLecture/:courseId/:lectureId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'read'),
    getSingleLectureValidator(),
    validationMiddleware,
    activityLogger("COURSE_LECTURE", "Get single lecture request"),
    getSingleLecture
);
router.get(
    '/getAllLecturesByModule/:courseId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'read'),
    activityLogger("COURSE_LECTURE", "Get all lectures by modules request"),
    getAllLecturesByModule
);
router.get(
    '/getAllLecturesStudentSideModuleWise/:courseId',
    authenticationMiddleware,   
    activityLogger("COURSE_LECTURE", "Get all lectures by modules request"),
    getAllLecturesStudentSideModuleWise
);
router.get(
    '/getSingleLectureStudentSide/:lectureId',
    authenticationMiddleware,
    activityLogger("COURSE_LECTURE", "Get all lectures by modules request"),
    getSingleLectureStudentSide
);

router.delete(
    '/deleteLecturePermanently/:lectureId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'delete'),
    deleteLectureValidator(),
    validationMiddleware,
    activityLogger("COURSE_LECTURE", "Delete lecture request"),
    deleteLecturePermanently
);
router.patch(
    '/deleteLecture/:courseId/:lectureId',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'delete'),
    //create and add later rn not working idk y will see
    activityLogger("COURSE_LECTURE", "Delete lecture request"),
    deleteLecture
);
router.patch(
    '/restoreLecture',
    authenticationMiddleware,
    routeAuthorizationMiddleware('course management', 'delete'),
    //create and add later rn not working idk y will see
    activityLogger("COURSE_LECTURE", "Delete lecture request"),
    restoreLecture
);

export default router;
