import mongoose from "mongoose";

const activityTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
}, { timestamps: true });

const activityTypeModel = mongoose.model("ActivityType", activityTypeSchema);

export default activityTypeModel;
