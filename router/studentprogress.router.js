import express from 'express'
import { assignRole, getAllStaff, getSingleStaff, getStaffwithAssignedRole, getStaffWithNoRoleAssignedYet, getStaffWithStatusPending, registerStaff, searchStaff, updateStaffRole, verifyRoleStatus, getInstructorAvailability, getAllInstructorsAvailability, toggleStaffStatus, removeStaffWithPendingStatus, restoreStaffWithPendingStatus, deleteStaffPermanently } from '../controller/staff.controller.js'
import authenticationMiddleware from '../middleware/authentication.middleware.js'
import { singleProfilePicture } from '../middleware/multer.middleware.js'
import activityLogger from '../middleware/activitylogger.middleware.js'
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js'
import { getAllEnrolledStudentsProgress, getInstructorStudentModules, getStudentCourseModules, getStudentProgress } from '../controller/studentmoduleprogress.controller.js'
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js'
const router = express.Router()

router.route("/getStudentProgress/:studentId").get(
    authenticationMiddleware,
    getStudentProgress)
router.route("/getAllStudentProgress").get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("student progress","read"),
    getAllEnrolledStudentsProgress)
// router.route("/getStudentCourseModules/:courseId").get(
//     authenticationMiddleware,
//     roleAuthorizationMiddleware("student"),
//     getStudentCourseModules)
// router.route("/getStudentCourseModules/:courseId").get(
//     authenticationMiddleware,
//     roleAuthorizationMiddleware("instructor"),
//     getStudentCourseModules)
// router.route("/getInstructorStudentModules/:courseId/:studentId").get(
//     authenticationMiddleware,
//     roleAuthorizationMiddleware("instructor"),
//     getInstructorStudentModules)


export default router