import express from 'express';
import {
    createDemoSessionRequest,
    getStudentDemoSessionRequests,
    getInstructorDemoSessions,
    getAllDemoSessionRequests,
    approveAndAssignInstructor
} from '../controller/demosessionrequest.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import {
    createDemoSessionRequestValidator,
    approveAndAssignInstructorValidator,
    getAllDemoSessionRequestsValidator
} from '../services/demosessionrequest.validator.services.js';
import { validationMiddleware } from '../services/auth.validator.services.js';

const router = express.Router();

// Student routes
router.route("/createDemoSessionRequest")
    .post(
        createDemoSessionRequestValidator(),
        validationMiddleware,
        authenticationMiddleware,
        roleAuthorizationMiddleware("student"),
        activityLogger("DEMO_SESSION", "Create demo session request"),
        createDemoSessionRequest
    );

router.route("/getStudentDemoSessionRequests")
    .get(
        authenticationMiddleware,
        roleAuthorizationMiddleware("student"),
        activityLogger("DEMO_SESSION", "Get student demo session requests"),
        getStudentDemoSessionRequests
    );

// Admin routes
router.route("/getAllDemoSessionRequests")
    .get(
        authenticationMiddleware,
        roleAuthorizationMiddleware("admin"),
        activityLogger("DEMO_SESSION", "Get all demo session requests"),
        getAllDemoSessionRequests
    )
    .post(
        getAllDemoSessionRequestsValidator(),
        validationMiddleware,
        authenticationMiddleware,
        roleAuthorizationMiddleware("admin"),
        activityLogger("DEMO_SESSION", "Get all demo session requests"),
        getAllDemoSessionRequests
    );

router.route("/approveAndAssignInstructor/:requestId")
    .patch(
        approveAndAssignInstructorValidator(),
        validationMiddleware,
        authenticationMiddleware,
        roleAuthorizationMiddleware("admin"),
        activityLogger("DEMO_SESSION", "Approve and assign instructor to demo session"),
        approveAndAssignInstructor
    );

// Instructor routes
router.route("/getInstructorDemoSessions")
    .get(
        authenticationMiddleware,
        roleAuthorizationMiddleware("instructor"),
        activityLogger("DEMO_SESSION", "Get instructor demo sessions"),
        getInstructorDemoSessions
    );

export default router;
