import { UNAUTHORIZED } from "../error/error.js";
import activityLogger from "../middleware/activitylogger.middleware.js";

function roleAuthorizationMiddleware(...roles) {
    return async (req, res, next) => {
        try {
            if (!roles.includes(req.user.role)) {
                await activityLogger(`UNAUTHORIZED_ACCESS`, `Attempted access to ${req.originalUrl}`)(req, res, () => {});
                throw new UNAUTHORIZED('You are not authorized to access this route');
            }
            next();
        } catch (err) {
            next(err);
        }
    }
}

export default roleAuthorizationMiddleware;
