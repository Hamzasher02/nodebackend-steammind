import express from 'express';
const router = express.Router();
router.all('/{*path}', (req, res) => res.status(200).json({ success: true, message: 'demosessionrequest route stub' }));
export default router;
