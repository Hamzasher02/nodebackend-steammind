import express from 'express'
// Import changePassword function for student password change functionality
// Lines Modified: 2 (ADDED changePassword import)
// Date: October 27, 2025 - Hamza Sher
import { changeInstructorAccountStatus, changeStudentAccountStatus, getAllInstructors, getAllStudents, getAllUsers, getSingleInstructor, getSingleStudent, getStudentBasicInformation, showCurrentUser, updateStudentInformation, changePassword, toggleStudentStatus } from '../controller/user.controller.js'
import authenticationMiddleware from '../middleware/authentication.middleware.js'
import { singleProfilePicture } from '../middleware/multer.middleware.js'
// Import changePasswordValidator for password validation
// Lines Modified: 8 (ADDED changePasswordValidator import)
// Date: October 27, 2025 - Hamza Sher
import { validationMiddleware, changePasswordValidator } from '../services/auth.validator.services.js'
import { updateStudentInformationValidator } from '../services/student.validator.services.js'
import activityLogger from '../middleware/activitylogger.middleware.js'
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js'

const router = express.Router()

// hamza hanif modified for activity logger 11 18 25
router.route('/showCurrentUser').get(
    authenticationMiddleware,
    activityLogger("READ", "Show current user request"),
    showCurrentUser
);

router.route('/getSingleStudent').get(
    authenticationMiddleware,
    activityLogger("READ", "Get single student request"),
    getSingleStudent
);

router.route('/getSingleInstructor').get(
    authenticationMiddleware,
    activityLogger("READ", "Get single instructor request"),
    getSingleInstructor
);

router.route('/updateStudentInformation').patch(
    singleProfilePicture,
    authenticationMiddleware,
    updateStudentInformationValidator(),
    validationMiddleware,
    activityLogger("UPDATE", "Update student information request"),
    updateStudentInformation
);

// ------------------------
// USER MANAGEMENT MODULE
// ------------------------

router.route('/getAllUsers').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get all users request"),
    getAllUsers
);

router.route('/getAllInstructors').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get all instructors request"),
    getAllInstructors
);

router.route('/getAllStudents').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get all students request"),
    getAllStudents
);

router.route('/changeStudentStatus').patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    activityLogger("UPDATE", "Change student status request"),
    changeStudentAccountStatus
);

router.route('/getStudentBasicInformation/:studentId').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get student basic information request"),
    getStudentBasicInformation
);

router.route('/changeInstructorStatus').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    activityLogger("UPDATE", "Change instructor status request"),
    changeInstructorAccountStatus
);
router.route('/toggleStudentStatus').patch(
    validationMiddleware,
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    activityLogger("PATCH", "Staff Status changed"),
    toggleStudentStatus
);
// router.route('/deleteInstructor').delete(
//     authenticationMiddleware,
//     roleAuthorizationMiddleware("user management", "delete"),
//     activityLogger("DELETE", "Delete instructor request"),
//     deleteInstructor
// );

// Student password change route - PATCH method for updating password
// Lines Modified: 24 (NEW ROUTE ADDED)
// Date: October 27, 2025 - Hamza Sher
// Middleware: authenticationMiddleware -> changePasswordValidator -> validationMiddleware -> changePassword
router.route('/changePassword').patch(
    authenticationMiddleware,
    changePasswordValidator(),
    validationMiddleware,
    changePassword
)

export default router
