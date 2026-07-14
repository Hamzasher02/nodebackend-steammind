import { BAD_REQUEST } from "../error/error.js";

function makeRoutesConsistent({ ROUTES = [], PERMISSIONS = [], routePermission = [] }) {
    let result = [];
    let addedRoutes = [];
    for (let item of routePermission) {
        let routeName = item.route;
        let perms = item.permissions || [];
        if (perms.length === 0) {
            throw new BAD_REQUEST(`Permissions are required for route: ${routeName}`);
        }
        if (!ROUTES.includes(routeName)) continue;
        if (addedRoutes.includes(routeName)) continue;
        let uniquePerms = [...new Set(perms.filter(p => PERMISSIONS.includes(p)))];
        if (!uniquePerms.includes("read")) uniquePerms.push('read');
        result.push({
            route: routeName,
            permissions: uniquePerms
        });
        addedRoutes.push(routeName);
    }

    return result;
}

export default makeRoutesConsistent
