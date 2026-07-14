/**
 * ===============================================
 * INSTRUCTOR ROUTER - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: 2025
 * Purpose: Define instructor-related API routes
 * Routes: Profile management, academic details, profile picture upload
 * ===============================================
 */

import express from 'express'
import {
    updateInstructorInformation,
    updateInstructorAcademicDetails,
    getInstructorProfile,
    changeInstructorPassword,
    getMyAssignedCourses,
    getCourseById,
    createTimeSlot,
    getMyTimeSlots,
    updateTimeSlot,
    deleteTimeSlot,
    getInstructorAvailability,
    getAllInstructorsAvailability,
    getInstructorsThatAreAssignedToACourse,
    getInstructorsThatCanBeAssignedToACourse,
    requestNewTrancript,
    verifyInstructorDocument,
    getVerifiedAndUnverifiedInstructorsCount,
    getNewInstructorsLast7DaysCount
} from '../controller/instructor.controller.js'
import authenticationMiddleware from '../middleware/authentication.middleware.js'
import { singleProfilePicture, singleTranscript } from '../middleware/multer.middleware.js'
import { validationMiddleware } from '../services/auth.validator.services.js'
import {
    requestNewTranscriptValidator,
    verifyInstructorTranscriptValidator, updateInstructorInformationValidator, updateInstructorAcademicValidator, changePasswordValidator, getInstructorsThatAreAssignedToACourseValidator, getInstructorsThatCanBeAssignedToACourseValidator
} from '../services/instructor.validator.services.js'
import { createTimeSlotValidator, updateTimeSlotValidator, timeSlotIdValidator, availabilityQueryValidator } from '../services/availability.validator.services.js'
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js'
//hamza hanif 11 18 25 
import activityLogger from '../middleware/activitylogger.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js'

const router = express.Router()

// Hamza Sher: Instructor profile routes
router.route('/getInstructorProfile').get(authenticationMiddleware, getInstructorProfile)
router.route('/updateInstructorInformation').patch(singleProfilePicture, authenticationMiddleware, updateInstructorInformationValidator(), validationMiddleware, updateInstructorInformation)
router.route('/updateInstructorAcademicDetails').patch(singleTranscript, authenticationMiddleware, updateInstructorAcademicValidator(), validationMiddleware, updateInstructorAcademicDetails)
router.route('/changePassword').patch(authenticationMiddleware, changePasswordValidator(), validationMiddleware, changeInstructorPassword)

// Hamza Sher: Instructor courses route - GET method for retrieving assigned courses only
// Lines Modified: 26 (UPDATED ROUTE)
// Date: December 22, 2025 - Hamza Sher
// Middleware: authenticationMiddleware (verify JWT token) -> roleAuthorizationMiddleware (verify instructor role) -> getMyAssignedCourses (controller function)
// Features: Search, filtering, pagination support
// Note: Only instructors can access this. Returns only courses assigned to this instructor
router.route('/getMyAssignedCourses').get(authenticationMiddleware, roleAuthorizationMiddleware('instructor'), getMyAssignedCourses)

// Hamza Sher: Instructor course by ID route - GET method for retrieving specific course by ID
// Lines Modified: 34 (NEW ROUTE ADDED)
// Date: October 28, 2025 - Hamza Sher
// Middleware: authenticationMiddleware (verify JWT token) -> getCourseById (controller function)
// Features: Complete course details with creator information
// Note: Instructor can view any course in the system by ID
router.route('/getCourseById/:courseId').get(authenticationMiddleware, getCourseById)

// Hamza Sher: Instructor availability management routes - POST method for creating time slots
// Lines Modified: 44-50 (NEW ROUTES ADDED)
// Date: October 28, 2025 - Hamza Sher
// Middleware: authenticationMiddleware (verify JWT token) -> createTimeSlotValidator (validation) -> validationMiddleware (error handling) -> createTimeSlot (controller function)
// Features: Time conflict checking, multiple days support, validation
// Note: Instructor can create multiple time slots for different days
router.route('/availability/createSlot').post(authenticationMiddleware, createTimeSlotValidator, validationMiddleware, createTimeSlot)

// Hamza Sher: Instructor availability management routes - GET method for retrieving time slots
// Lines Modified: 52-58 (NEW ROUTE ADDED)
// Date: October 28, 2025 - Hamza Sher
// Middleware: authenticationMiddleware (verify JWT token) -> availabilityQueryValidator (query validation) -> validationMiddleware (error handling) -> getMyTimeSlots (controller function)
// Features: Pagination, filtering, search, summary statistics
// Note: Instructor can view all their created time slots with filtering options
router.route('/availability/mySlots').get(authenticationMiddleware, availabilityQueryValidator, validationMiddleware, getMyTimeSlots)

// Hamza Sher: Instructor availability management routes - PATCH method for updating time slots
// Lines Modified: 60-66 (NEW ROUTE ADDED)
// Date: October 28, 2025 - Hamza Sher
// Middleware: authenticationMiddleware (verify JWT token) -> updateTimeSlotValidator (validation) -> validationMiddleware (error handling) -> updateTimeSlot (controller function)
// Features: Conflict checking, ownership verification, validation
// Note: Instructor can only update their own time slots
router.route('/availability/updateSlot/:slotId').patch(authenticationMiddleware, updateTimeSlotValidator, validationMiddleware, updateTimeSlot)

// Hamza Sher: Instructor availability management routes - DELETE method for deleting time slots
// Lines Modified: 68-74 (NEW ROUTE ADDED)
// Date: October 28, 2025 - Hamza Sher
// Middleware: authenticationMiddleware (verify JWT token) -> timeSlotIdValidator (validation) -> validationMiddleware (error handling) -> deleteTimeSlot (controller function)
// Features: Soft delete, ownership verification
// Note: Instructor can only delete their own time slots
router.route('/availability/deleteSlot/:slotId').delete(authenticationMiddleware, timeSlotIdValidator, validationMiddleware, deleteTimeSlot)

//hamza Hanif 11 13 25
router.route('/getInstrcutorsAssignedToACourse/:courseId').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    getInstructorsThatAreAssignedToACourseValidator(),
    validationMiddleware,
    activityLogger("INSTRUCTOR", "Get instructors assigned to a course"),
    getInstructorsThatAreAssignedToACourse
);

router.route('/getInstructorsThatCanBeAssignedToACourse/:courseId').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    getInstructorsThatCanBeAssignedToACourseValidator(),
    validationMiddleware,
    activityLogger("INSTRUCTOR", "Get instructors that can be assigned to a course"),
    getInstructorsThatCanBeAssignedToACourse
);

router.route("/getVerifiedAndUnverifiedInstructors").get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    activityLogger("INSTRUCTOR", "Get verified and unverified instructors count"),
    getVerifiedAndUnverifiedInstructorsCount
);

router.route("/verifyInstructorDocument").patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    verifyInstructorTranscriptValidator(),
    validationMiddleware,
    activityLogger("INSTRUCTOR", "Verify instructor transcript"),
    verifyInstructorDocument
);

router.route("/requestNewTranscript").patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    requestNewTranscriptValidator(),
    validationMiddleware,
    activityLogger("INSTRUCTOR", "Request new transcript from instructor"),
    requestNewTrancript
);

router.route("/getNewInstructors").get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    requestNewTranscriptValidator(),
    validationMiddleware,
    activityLogger("INSTRUCTOR", "Get new instructors in last 7 days"),
    getNewInstructorsLast7DaysCount
);



export default router
