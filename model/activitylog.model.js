import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    email: {
        type: String,
        default: "unknown"
    },
    name: {
        type: String,
        default: "unknown"
    },
    actionType: {
        type: String,
        required: true
    },
    sessionStatus: {
        type: String,
        enum: ["active", "expired", "inactive"],
        default: "inactive"
    },
    ipAddress: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: null
    },
    actionDescription: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, { timestamps: true });

const activityLogModel = mongoose.model("ActivityLog", activityLogSchema);

export default activityLogModel;
