import express from 'express';
import * as ctrl from '../controller/blog.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import {
    uploadBlogFeaturedImage,
    uploadBlogCardImage
} from '../middleware/blog.multer.middleware.js';

const router = express.Router();

const isEditor = [
    authenticationMiddleware,
    roleAuthorizationMiddleware('admin', 'website manager', 'instructor')
];

// Public
router.get('/', ctrl.getAllBlogs);
router.get('/:blogId', ctrl.getSingleBlog);

// Protected — Admin / Website Manager / Instructor
router.post('/', ...isEditor, uploadBlogFeaturedImage, ctrl.createBlog);
router.patch('/:blogId', ...isEditor, uploadBlogFeaturedImage, ctrl.updateBlog);
router.delete('/:blogId', ...isEditor, ctrl.deleteBlog);

router.post('/:blogId/cards', ...isEditor, uploadBlogCardImage, ctrl.addBlogCard);
router.patch('/:blogId/cards/:cardId', ...isEditor, uploadBlogCardImage, ctrl.updateBlogCard);
router.delete('/:blogId/cards/:cardId', ...isEditor, ctrl.deleteBlogCard);

export default router;
