import express from 'express';
import { createRole, deleteRole, getSingleRole, getAllRoles, updateRole, restoreRole } from '../controller/role.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import { createRoleValidator, deleteRoleValidator, getSingleRoleValidator, updateRoleValidator } from '../services/role.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';

const router = express.Router();

router.route('/createRole').post(
    authenticationMiddleware,
    routeAuthorizationMiddleware('user management', 'write'),
    createRoleValidator(),
    validationMiddleware,
    activityLogger("ROLE", "Create role request"),
    createRole
);

router.route('/getAllRoles').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware('user management', 'read'),
    activityLogger("ROLE", "Get all roles request"),
    getAllRoles
);

router.route('/getSingleRole/:roleId').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware('user management', 'read'),
    getSingleRoleValidator(),
    validationMiddleware,
    activityLogger("ROLE", "Get single role request"),
    getSingleRole
);

router.route('/updateRole').patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware('user management', 'update'),
    updateRoleValidator(),
    validationMiddleware,
    activityLogger("ROLE", "Update role request"),
    updateRole
);

router.route('/deleteRole').patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware('user management', 'delete'),
    deleteRoleValidator(),
    validationMiddleware,
    activityLogger("ROLE", "Delete role request"),
    deleteRole
);

router.route('/restoreRole').patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware('user management', 'update'),
    deleteRoleValidator(),
    validationMiddleware,
    activityLogger("ROLE", "Restore role request"),
    restoreRole
);

export default router;
