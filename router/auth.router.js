import express from 'express'
import { studentRegistrationValidator, instructorRegistrationValidator, validationMiddleware, loginValidator, staffLoginValidator, forgotPasswordValidator, otpValidator, resetPasswordWithOtpValidator } from '../services/auth.validator.services.js'
import { loginUser, registerInstructor, registerStudent, verifyEmailAddress, logoutUser, loginStaff, forgotPassword, verifyInitialOtp, resetPasswordWithOtp } from '../controller/auth.controller.js'
import { uploadTranscriptAndProfilePictrue, singleProfilePicture } from '../middleware/multer.middleware.js'
import activityLogger from '../middleware/activitylogger.middleware.js'

const router = express.Router()

router.route('/register/student').post(
    singleProfilePicture,
    studentRegistrationValidator(),
    validationMiddleware,
    activityLogger("REGISTRATION", "Student registration request"),
    registerStudent
);

router.route('/register/instructor').post(
    uploadTranscriptAndProfilePictrue,
    instructorRegistrationValidator(),
    validationMiddleware,
    activityLogger("REGISTRATION", "Instructor registration request"),
    registerInstructor
);

router.route('/login/staff').post(
    staffLoginValidator(),
    validationMiddleware,
    activityLogger("LOGIN", "Staff login request"),
    loginStaff
);

router.route('/login/users').post(
    loginValidator(),
    validationMiddleware,
    activityLogger("LOGIN", "Users login request"),
    loginUser
);

router.route('/logout').get(
    activityLogger("LOGOUT", "Logout request"),
    logoutUser
);

router.route('/verifyEmailAddress').post(
    otpValidator(),
    validationMiddleware,
    activityLogger("EMAIL_VERIFICATION", "Email verification request"),
    verifyEmailAddress
);

router.route('/forgotPassword').post(
    forgotPasswordValidator(),
    validationMiddleware,
    activityLogger("EMAIL_VERIFICATION", "Email verification request"),
    forgotPassword
);
router.route('/verifyInitialOtp').post(
    otpValidator(),
    validationMiddleware,
    activityLogger("EMAIL_VERIFICATION", "Email verification request"),
    verifyInitialOtp
);
router.route('/resetPasswordWithOtp').post(
    resetPasswordWithOtpValidator(),
    validationMiddleware,
    activityLogger("EMAIL_VERIFICATION", "Email verification request"),
    resetPasswordWithOtp
);


export default router
