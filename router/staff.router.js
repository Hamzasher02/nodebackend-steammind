import express from 'express'
import { assignRole, getAllStaff, getSingleStaff, getStaffwithAssignedRole, getStaffWithNoRoleAssignedYet, getStaffWithStatusPending, registerStaff, searchStaff, updateStaffRole, verifyRoleStatus, getInstructorAvailability, getAllInstructorsAvailability, toggleStaffStatus, removeStaffWithPendingStatus, restoreStaffWithPendingStatus, deleteStaffPermanently } from '../controller/staff.controller.js'
import authenticationMiddleware from '../middleware/authentication.middleware.js'
import { assignRoleValidator, getSingleStaffValidator, searchStaffValidator, toggleStaffValidator, updateStaffRoleValidator, verifyRoleStatusValidator } from '../services/staff.validator.js'
import { staffRegisterationValidator, validationMiddleware } from '../services/auth.validator.services.js'
import { instructorIdValidator, availabilityQueryValidator } from '../services/availability.validator.services.js'
import { singleProfilePicture } from '../middleware/multer.middleware.js'
import activityLogger from '../middleware/activitylogger.middleware.js'
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js'
const router = express.Router()

router.route('/getStaffWithNoRoles').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get staff with no roles request"),
    getStaffWithNoRoleAssignedYet
);

router.route('/assignRole').post(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    assignRoleValidator(),
    validationMiddleware,
    activityLogger("UPDATE", "Assign role request"),
    assignRole
);

router.route('/verifyStaffStatus/:userId/:secret').get(
    verifyRoleStatusValidator(),
    validationMiddleware,
    activityLogger("READ", "Verify staff status request"),
    verifyRoleStatus
);

router.route('/register').post(
    singleProfilePicture,
    staffRegisterationValidator(),
    validationMiddleware,
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "write"),
    activityLogger("CREATE", "Register staff request"),
    registerStaff
);

router.route('/getStaffWithRoles').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get staff with roles request"),
    getStaffwithAssignedRole
);

router.route('/getStaffWithPendingStatus').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get staff with pending status request"),
    getStaffWithStatusPending
);

router.route('/getAllStaff').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get all staff request"),
    getAllStaff
);

router.route('/getSingleStaff/:id').get(
    getSingleStaffValidator(),
    validationMiddleware,
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Get single staff request"),
    getSingleStaff
);

router.route('/toggleStaffStatus').patch(
    toggleStaffValidator(),
    validationMiddleware,
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    activityLogger("PATCH", "Staff Status changed"),
    toggleStaffStatus
);

router.route('/searchStaff').post(
    searchStaffValidator(),
    validationMiddleware,
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    activityLogger("READ", "Search staff request"),
    searchStaff
);

router.route('/updateStaffRole').patch(
    updateStaffRoleValidator(),
    validationMiddleware,
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    activityLogger("UPDATE", "Update staff role request"),
    updateStaffRole
);
router.route('/removeStaffWithPendingStatus').patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    activityLogger("UPDATE", "Deleting staff with pending role"),
    removeStaffWithPendingStatus
);
router.route('/restoreStaffWithPendingStatus').patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    activityLogger("UPDATE", "Update staff role request"),
    restoreStaffWithPendingStatus
);
router.route('/deleteStaffPermanently/:staffId').delete(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "update"),
    activityLogger("UPDATE", "Update staff role request"),
    deleteStaffPermanently
);

// Hamza Sher: Staff availability management routes - GET method for viewing specific instructor availability
// Lines Modified: 23-29 (NEW ROUTES ADDED)
// Date: October 28, 2025 - Hamza Sher
// Middleware: authenticationMiddleware (verify JWT token) -> roleAuthorizationMiddleware("staff") (verify staff role) -> instructorIdValidator (validate instructor ID) -> availabilityQueryValidator (validate query params) -> validationMiddleware (error handling) -> getInstructorAvailability (controller function)
// Features: Pagination, filtering, search, instructor validation
// Note: Only staff can view instructor availability
router.route('/availability/instructor/:instructorId').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    instructorIdValidator,
    availabilityQueryValidator,
    validationMiddleware,
    getInstructorAvailability
)

// Hamza Sher: Staff availability management routes - GET method for viewing all instructors availability
// Lines Modified: 31-37 (NEW ROUTE ADDED)
// Date: October 28, 2025 - Hamza Sher
// Middleware: authenticationMiddleware (verify JWT token) -> roleAuthorizationMiddleware("staff") (verify staff role) -> availabilityQueryValidator (validate query params) -> validationMiddleware (error handling) -> getAllInstructorsAvailability (controller function)
// Features: Pagination, filtering, search, aggregated data
// Note: Only staff can view all instructors availability
router.route('/availability/allInstructors').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("user management", "read"),
    availabilityQueryValidator,
    validationMiddleware,
    getAllInstructorsAvailability
)

export default router
