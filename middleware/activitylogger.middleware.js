import activityLogModel from "../model/activitylog.model.js";
import activityTypeModel from "../model/activitytype.model.js";
import geoip from "geoip-lite";

const activityLogger = (activityType, actionDescription) => (req, res, next) => {
    res.on("finish", async () => {
        try {
            let type = await activityTypeModel.findOne({ name: activityType });
            if (!type) {
                type = await activityTypeModel.create({ name: activityType });
            }
            const email = req.user?.email || req.body?.email || "unknown";
            const name = req.user?.firstName && req.user?.lastName
                ? `${req.user.firstName} ${req.user.lastName}`
                : "unknown";

            let sessionStatus = "inactive";
            if (req.user) sessionStatus = "active";
            else if (req.body?.email) sessionStatus = res.statusCode >= 200 && res.statusCode < 400 ? "active" : "expired";
            const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
            const geo = geoip.lookup(ipAddress) || {};
            const location = geo.city ? `${geo.city}, ${geo.country}` : null;

             await activityLogModel.create({
                email,
                name,
                actionType: type.name,
                sessionStatus,
                ipAddress,
                location,
                actionDescription
            });
        } catch (err) {
           
        }
    });

    next();
};

export default activityLogger;
