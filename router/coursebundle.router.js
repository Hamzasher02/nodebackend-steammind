import express from 'express'
import authenticationMiddleware from '../middleware/authentication.middleware.js'
import activityLogger from '../middleware/activitylogger.middleware.js'
import { validationMiddleware } from '../services/auth.validator.services.js'
import { createBundleValidator, updateBundleValidator, getSingleBundleValidator, deleteOrRestoreBundleValidator } from '../services/coursebundle.validator.services.js'
import {
    createBundle,
    getAllBundles,
    getSingleBundle,
    updateBundle,
    deleteBundle,
    restoreBundle
} from '../controller/coursebundle.controller.js'
import { singleProfilePicture } from '../middleware/multer.middleware.js'
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js'

const router = express.Router()

router.route('/createBundle').post(
    singleProfilePicture,
    authenticationMiddleware,
    routeAuthorizationMiddleware("course bundle", "create"),
    createBundleValidator(),
    validationMiddleware,
    // activityLogger("CREATE", "Create course bundle request"),
    createBundle
)

router.route('/getAllBundles').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("course bundle", "read"),
    activityLogger("READ", "Get all course bundles request"),
    getAllBundles
)

router.route('/getSingleBundle/:id').get(
    authenticationMiddleware,
    routeAuthorizationMiddleware("course bundle", "read"),
    getSingleBundleValidator(),
    validationMiddleware,
    activityLogger("READ", "Get single course bundle request"),
    getSingleBundle
)

router.route('/updateBundle/:id').patch(
    singleProfilePicture,
    authenticationMiddleware,
    routeAuthorizationMiddleware("course bundle", "update"),
    updateBundleValidator(),
    validationMiddleware,
    activityLogger("UPDATE", "Update course bundle request"),
    updateBundle
)

router.route('/deleteBundle/:id').patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware("course bundle", "delete"),
    deleteOrRestoreBundleValidator(),
    validationMiddleware,
    activityLogger("DELETE", "Soft delete course bundle request"),
    deleteBundle
)

router.route('/restoreBundle/:id').patch(
    authenticationMiddleware,
    routeAuthorizationMiddleware("course bundle", "update"),
    deleteOrRestoreBundleValidator(),
    validationMiddleware,
    activityLogger("UPDATE", "Restore course bundle request"),
    restoreBundle
)

export default router
