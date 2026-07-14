import express from 'express'
import authenticationMiddleware from '../middleware/authentication.middleware.js'
import activityLogger from '../middleware/activitylogger.middleware.js'
import { createCategory, deleteCategory, deleteCategoryPermanently, getAllAgeGroups, getAllCategories, getCategoryAgeGroups, getCategoryLevels, getSingleCategory, getSubCategories, restoreCategory, updateCategory } from '../controller/category.controller.js'
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js'
import { singleProfilePicture } from '../middleware/multer.middleware.js'
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js'

const router = express.Router()

router.route('/createCategory')
    .post(
        singleProfilePicture,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "write"),
        activityLogger("CATEGORY_MANAGEMENT", "Create category request"),
        createCategory
    );

router.route('/getAllCategory')
    .get(

        activityLogger("CATEGORY_MANAGEMENT", "Get all categories request"),
        getAllCategories
    );

router.route('/getSingleCategory/:categoryId')
    .get(
        activityLogger("CATEGORY_MANAGEMENT", "Get single category request"),
        getSingleCategory
    );

router.route('/updateCategory')
    .patch(singleProfilePicture,
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "update"),
        activityLogger("CATEGORY_MANAGEMENT", "Update category request"),
        updateCategory
    );

router.route('/deleteCategory/:categoryId')
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "delete"),
        activityLogger("CATEGORY_MANAGEMENT", "Delete category request"),
        deleteCategory
    );

router.route('/restoreCategory/:categoryId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "update"),
        activityLogger("CATEGORY_MANAGEMENT", "Restore category request"),
        restoreCategory
    );
router.route('/getAllCategoryAgeGroups/:categoryId')
    .get(

        activityLogger("CATEGORY_MANAGEMENT", "Geting category "),
        getCategoryAgeGroups
    );
router.route('/getAllCategoryLevels/:categoryId')
    .get(

        activityLogger("CATEGORY_MANAGEMENT", "Geting category "),
        getCategoryLevels
    );
router.route('/getAllCategorySubgroups/:categoryId')
    .get(

        activityLogger("CATEGORY_MANAGEMENT", "Geting category "),
        getSubCategories
    );
router.route('/getAllAgeGroups')
    .get(
        activityLogger("CATEGORY_MANAGEMENT", "Geting category "),
        getAllAgeGroups
    );
router.route('/deleteCategoryPermanently/:categoryId')
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware("course management", "delete"),
        activityLogger("CATEGORY_MANAGEMENT", "deleting category permenantly "),
        deleteCategoryPermanently
    );

export default router
