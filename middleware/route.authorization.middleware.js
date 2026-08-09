import { UNAUTHORIZED } from "../error/error.js";
import roleModel from "../model/role.model.js";
import activityLogger from "../middleware/activitylogger.middleware.js";


function routeAuthorizationMiddleware(route, action = "read") {
    return async (req, res, next) => {
        try {
            const userRoleName = req.user.role;
            if (req.user.role === 'admin') return next();
            if (!userRoleName) {
                await activityLogger(`UNAUTHORIZED_ACCESS`, `No role assigned. Attempted access to ${req.originalUrl}`)(req, res, () => { });
                throw new UNAUTHORIZED('No role assigned. You are not authorized to access this route');
            }
            const role = await roleModel.findOne({ name: userRoleName, isDeleted: false });
            if (!role) {
                await activityLogger(`UNAUTHORIZED_ACCESS`, `Role not found. Attempted access to ${req.originalUrl}`)(req, res, () => { });
                throw new UNAUTHORIZED('Your role does not exist or has been deleted');
            }
            const routePermission = role.routePermission.find(rp => rp.route === route);
            if (!routePermission || !routePermission.permissions.includes(action)) {
                await activityLogger(`UNAUTHORIZED_ACCESS`, `Insufficient permission. Attempted access to ${req.originalUrl}`)(req, res, () => { });
                throw new UNAUTHORIZED('You do not have permission to perform this action');
            }

            next();
        } catch (err) {
            next(err);
        }
    }
}

export default routeAuthorizationMiddleware;
