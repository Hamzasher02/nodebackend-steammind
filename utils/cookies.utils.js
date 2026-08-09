import jwt from 'jsonwebtoken';
import cookieSignature from 'cookie-signature';

const JWT_SECRET = process.env.JWT_SECRET || 'add json web token secret here';
const COOKIE_SECRET = process.env.COOKIE_PARSER_SECRET || 'add cookie secret key here';

export function attachCookie({ res, user, tokenName = 'accessToken' }) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(tokenName, token, {
    httpOnly: true,
    signed: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
}

export function attachCookiesToResponse({ res, user, tokenName = 'accessToken' }) {
  return attachCookie({ res, user, tokenName });
}

export function removeCookie({ res }) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

export function verifyJWT({ token }) {
  return jwt.verify(token, JWT_SECRET);
}

