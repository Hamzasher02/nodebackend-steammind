import express from "express";
import authenticationMiddleware from "../middleware/authentication.middleware.js";
import routeAuthorizationMiddleware from "../middleware/route.authorization.middleware.js";
import { validationMiddleware } from "../services/auth.validator.services.js";
import activityLogger from "../middleware/activitylogger.middleware.js";

import { createNameChangeRequest, getAllNameChangeRequests, getSingleNameChangeRequest, approveOrRejectNameChangeRequest } from "../controller/namechangerequest.model.js";

import { createNameChangeRequestValidator, approveNameChangeRequestValidator } from "../services/namechangerequest.validator.js";
import roleAuthorizationMiddleware from "../middleware/authorization.middleware.js";

const router = express.Router();


router.post(
    "/createNameChangeRequest",
    authenticationMiddleware,
    roleAuthorizationMiddleware("student"),
    createNameChangeRequestValidator(),
    validationMiddleware,
    activityLogger("NAME_CHANGE", "Create name change request"),
    createNameChangeRequest
);

router.get(
    "/getAllNameChangeRequests",
    authenticationMiddleware,
    routeAuthorizationMiddleware("profile management", "read"),
    activityLogger("NAME_CHANGE", "Get all name change requests"),
    getAllNameChangeRequests
);

router.get(
    "/getSingleNameChangeRequest/:id",
    authenticationMiddleware,
    routeAuthorizationMiddleware("profile management", "read"),
    activityLogger("NAME_CHANGE", "Get single name change request"),
    getSingleNameChangeRequest
);

router.patch(
    "/approveOrRejectNameChangeRequest/:id",
    authenticationMiddleware,
    routeAuthorizationMiddleware("profile management", "update"),
    approveNameChangeRequestValidator(),
    validationMiddleware,
    activityLogger("NAME_CHANGE", "Approve name change request"),
    approveOrRejectNameChangeRequest
);

export default router;
