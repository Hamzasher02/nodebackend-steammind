import express from 'express'
import {
    assignInstructorToACourse,
    createCourse,
    getAdminCatalog,
    getAllCoursesAdminSideWhileCreatingBundle,
    getAllCoursesUserSide,
    getCourseCompletion,
    getSingleCourseAdminSide,
    getSingleCourseUserSide,
    publishCourse,
    removeAssignedInstructor,
    toggleCourseVisibility,
    updateCourseBasicInformation
} from '../controller/course.controller.js'
import { uploadTranscriptAndProfilePictrue } from '../middleware/multer.middleware.js'
import authenticationMiddleware from '../middleware/authentication.middleware.js'
import activityLogger from '../middleware/activitylogger.middleware.js'
import {
    assignInstructorValidator,
    createCourseValidator,
    publishCourseValidator,
    removeAssignedInstructorValidator,
    toggleCourseVisibilityValidator,
    updateCourseValidator
} from '../services/course.validators.services.js'
import { validationMiddleware } from '../services/auth.validator.services.js'
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js'

const router = express.Router()

router.route("/createCourse")
    .post(
        uploadTranscriptAndProfilePictrue,
        createCourseValidator(),
        validationMiddleware,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "write"),
        activityLogger("COURSE_MANAGEMENT", "Create course request"),
        createCourse
    );

router.route("/getAllCoursesAdminSideWhileCreatingBundle")
    .get(
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "read"),
        activityLogger("COURSE_MANAGEMENT", "Get all courses (admin) request"),
        getAllCoursesAdminSideWhileCreatingBundle
    );
router.route("/getCourseCatalogAdminSide")
    .get(
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "read"),
        activityLogger("COURSE_MANAGEMENT", "Get all courses (admin) request"),
        getAdminCatalog
    );

router.route("/getSingleCourseAdminSide/:courseId")
    .get(
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "read"),
        activityLogger("COURSE_MANAGEMENT", "Get single course (admin) request"),
        getSingleCourseAdminSide
    );

router.route("/getAllCoursesUserSide")
    .get(
        activityLogger("COURSE_MANAGEMENT", "Get all courses (student) request"),
        getAllCoursesUserSide
    );

router.route("/getSingleCourseUserSide/:courseId")
    .get(
        activityLogger("COURSE_MANAGEMENT", "Get single course (student) request"),
        getSingleCourseUserSide
    );

router.route("/updateCourseBasicInformation/:courseId")
    .patch(
        uploadTranscriptAndProfilePictrue,
        updateCourseValidator(),
        validationMiddleware,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "update"),
        activityLogger("COURSE_MANAGEMENT", "Update course basic information request"),
        updateCourseBasicInformation
    );

router.route("/toggleVisiblity/:courseId")
    .get(
        toggleCourseVisibilityValidator(),
        validationMiddleware,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "update"),
        activityLogger("COURSE_MANAGEMENT", "Toggle course visibility request"),
        toggleCourseVisibility
    );

router.route("/publishCourse/:courseId")
    .get(
        publishCourseValidator(),
        validationMiddleware,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "update"),
        activityLogger("COURSE_MANAGEMENT", "Publish course request"),
        publishCourse
    );

router.route("/removeInstructorFromACourse/:courseId")
    .patch(
        removeAssignedInstructorValidator(),
        validationMiddleware,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "update"),
        activityLogger("COURSE_MANAGEMENT", "Remove instructor from course request"),
        removeAssignedInstructor
    );

router.route("/assignInstructorToACourse/:courseId")
    .patch(
        assignInstructorValidator(),
        validationMiddleware,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "update"),
        activityLogger("COURSE_MANAGEMENT", "Assign instructor to course request"),
        assignInstructorToACourse
    );

router.route("/getCourseCompletion/:courseId")
    .get(
        toggleCourseVisibilityValidator(),
        validationMiddleware,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "read"),
        activityLogger("COURSE_MANAGEMENT", "Get course completion request"),
        getCourseCompletion
    );

export default router
