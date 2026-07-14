import ActivityTypeModel from "../model/activitytype.model.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { StatusCodes } from "http-status-codes";
import { NOT_FOUND } from "../error/error.js";

const getAllActivityTypes = asyncWrapper(async (req, res) => {
    const activityTypes = await ActivityTypeModel.find().sort("name").select("name");

    if (activityTypes.length === 0) {
        throw new NOT_FOUND("No activity types found.");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All activity types",
        data: activityTypes
    });
});

export { getAllActivityTypes };
