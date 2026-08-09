import express from 'express';
const router = express.Router();
router.all('/{*path}', (req, res) => res.status(200).json({ success: true, message: 'coursefeedback route stub' }));
export default router;
