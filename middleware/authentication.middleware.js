import { UNAUTHENTICATED } from "../error/error.js";
import refreshTokenModel from "../model/refreshtoken.model.js";
import { attachCookie, verifyJWT } from "../utils/cookies.utils.js";
import activityLogger from "../middleware/activitylogger.middleware.js";

async function authenticationMiddleware(req, res, next) {
    let accessToken = req.signedCookies?.accessToken || req.cookies?.accessToken;
    let refreshToken = req.signedCookies?.refreshToken || req.cookies?.refreshToken;

    if (!accessToken && req.headers?.authorization) {
        accessToken = req.headers.authorization.replace(/^Bearer\s+/i, '');
    }

    if (!accessToken && req.headers?.cookie) {
        const rawCookie = req.headers.cookie;
        const match = rawCookie.match(/accessToken=([^;]+)/);
        if (match) {
            let tokenVal = decodeURIComponent(match[1]).trim();
            if (tokenVal.startsWith('s:')) {
                tokenVal = tokenVal.slice(2);
                const parts = tokenVal.split('.');
                if (parts.length > 3) {
                    tokenVal = parts.slice(0, 3).join('.');
                }
            }
            accessToken = tokenVal;
        }
    }

    try {
        if (!accessToken && !refreshToken) {
            throw new UNAUTHENTICATED("Authentication error: JWT must be provided");
        }

        if (accessToken) {
            try {
                const { email, role, userId, firstName, lastName } = verifyJWT({ token: accessToken });
                req.user = { email, role, userId, firstName, lastName };
                return next();
            } catch (jwtErr) {
                // If accessToken is present but invalid, throw immediately
                throw new UNAUTHENTICATED(`Authentication error: ${jwtErr.message}`);
            }
        }

        let payload;
        try {
            payload = verifyJWT({ token: refreshToken });
        } catch (jwtErr) {
            throw new UNAUTHENTICATED(`Authentication error: ${jwtErr.message}`);
        }

        const existingToken = await refreshTokenModel.findOne({
            createdBy: payload.user.userId,
            refreshToken: payload.refreshToken
        });

        if (!existingToken || !existingToken.isValid) {
            throw new UNAUTHENTICATED("Authentication error: Invalid or expired session");
        }

        attachCookie({ user: payload.user, refreshToken: existingToken.refreshToken, res });
        req.user = payload.user;
        next();
    } catch (err) {
        req.user = req.user || { email: req.body?.email || "unknown", firstName: null, lastName: null };
        const logger = activityLogger("LOGIN", "Authentication failed");
        logger(req, res, () => {});
        next(err); // pass the error to the global error handler
    }
}

export default authenticationMiddleware;
