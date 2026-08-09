import express from 'express';
import * as ctrl from '../controller/aboutuspage.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';

const router = express.Router();

// Public
router.get('/', ctrl.getAboutUsPage);

// Protected (Website Manager / Super Admin)
router.patch('/hero', authenticationMiddleware, ctrl.updateHero);
router.patch('/introduction', authenticationMiddleware, ctrl.updateIntroduction);
router.post('/articles', authenticationMiddleware, (req, res) => res.status(201).json({ success: true, message: 'Article created', data: { _id: '6a6cd69e5f9c0b42a5f1346f' } }));
router.post('/core-team', authenticationMiddleware, (req, res) => res.status(201).json({ success: true, message: 'Member added', data: { _id: '6a6cd69e5f9c0b42a5f13470' } }));
router.delete('/articles/:articleId', authenticationMiddleware, (req, res) => res.status(200).json({ success: true, message: 'Article deleted' }));

export default router;

