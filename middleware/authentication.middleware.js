import { UNAUTHENTICATED } from "../error/error.js";
import refreshTokenModel from "../model/refreshtoken.model.js";
import { attachCookie, verifyJWT } from "../utils/cookies.utils.js";
import activityLogger from "../middleware/activitylogger.middleware.js";

async function authenticationMiddleware(req, res, next) {
    const { accessToken, refreshToken } = req.signedCookies;

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
