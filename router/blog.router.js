import express from 'express';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import routeAuthorizationMiddleware from '../middleware/route.authorization.middleware.js';
import activityLogger from '../middleware/activitylogger.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    uploadBlogFeaturedImage,
    uploadBlogCardImage
} from '../middleware/blog.multer.middleware.js';
import {
    getAllBlogs,
    getSingleBlog,
    createBlog,
    updateBlog,
    deleteBlog,
    addBlogCard,
    updateBlogCard,
    deleteBlogCard
} from '../controller/blog.controller.js';
import {
    createBlogValidator,
    updateBlogValidator,
    blogCardValidator
} from '../services/blog.validator.services.js';

const router = express.Router();

// 1. Get All Blogs / Create Blog post
router.route('/')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get all blog posts request'),
        getAllBlogs
    )
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadBlogFeaturedImage,
        createBlogValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Create blog post request'),
        createBlog
    );

// 2. Get Single Blog / Update Blog post / Delete Blog post
router.route('/:blogId')
    .get(
        activityLogger('WEBSITE_MANAGEMENT', 'Get single blog post request'),
        getSingleBlog
    )
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadBlogFeaturedImage,
        updateBlogValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update blog post request'),
        updateBlog
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete blog post request'),
        deleteBlog
    );

// 3. Add Blog Card
router.route('/:blogId/cards')
    .post(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'write'),
        uploadBlogCardImage,
        blogCardValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Add blog card request'),
        addBlogCard
    );

// 4. Update / Delete Blog Card
router.route('/:blogId/cards/:cardId')
    .patch(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'update'),
        uploadBlogCardImage,
        blogCardValidator(),
        validationMiddleware,
        activityLogger('WEBSITE_MANAGEMENT', 'Update blog card request'),
        updateBlogCard
    )
    .delete(
        authenticationMiddleware,
        routeAuthorizationMiddleware('website management', 'delete'),
        activityLogger('WEBSITE_MANAGEMENT', 'Delete blog card request'),
        deleteBlogCard
    );

export default router;
