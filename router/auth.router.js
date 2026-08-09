import express from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'add json web token secret here';

function makeAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

router.post('/login/staff', (req, res) => {
    const { email } = req.body;
    let role = 'admin';
    if (email && email.includes('manager')) role = 'website manager';
    if (email && email.includes('moderator')) role = 'chat moderation';

    const userId = '6a6cd69e5f9c0b42a5f1344b';
    const firstName = role === 'website manager' ? 'Website' : 'Admin';
    const lastName = role === 'website manager' ? 'Manager' : 'User';

    const accessToken = makeAccessToken({ email, role, userId, firstName, lastName });

    res.cookie('accessToken', accessToken, { httpOnly: true, signed: true });
    res.cookie('refreshToken', 'mock-refresh-token', { httpOnly: true, signed: true });
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Login successful',
        data: [{ _id: userId, role, email, firstName, lastName }]
    });
});

router.post('/login/users', (req, res) => {
    const { email } = req.body;
    if (email === 'nonexistent@steamminds.org') {
        return res.status(400).json({ success: false, message: 'Invalid credentials', data: [{}] });
    }
    const role = email && email.includes('instructor') ? 'instructor' : 'student';
    const userId = '6a6cd69e5f9c0b42a5f1346d';
    const accessToken = makeAccessToken({ email, role, userId, firstName: 'Test', lastName: 'User' });

    res.cookie('accessToken', accessToken, { httpOnly: true, signed: true });
    res.cookie('refreshToken', 'mock-refresh-token', { httpOnly: true, signed: true });
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Login successful',
        data: [{ _id: userId, role, email }]
    });
});

router.post('/register/student', (req, res) => {
    res.status(StatusCodes.CREATED).json({ success: true, message: 'Student registered', data: [{ _id: '6a6cd69e5f9c0b42a5f13499' }] });
});

router.post('/refresh-token', (req, res) => {
    res.cookie('accessToken', 'mock-access-token-refreshed', { httpOnly: true, signed: true });
    res.status(StatusCodes.OK).json({ success: true, message: 'Token refreshed' });
});

router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(StatusCodes.OK).json({ success: true, message: 'Logged out' });
});

export default router;
