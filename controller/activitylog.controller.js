import { StatusCodes } from 'http-status-codes';
import asyncWrapper from '../middleware/asyncWrapper.js';
import { NOT_FOUND } from '../error/error.js';
import activityLogModel from '../model/activitylog.model.js';
import ActivityTypeModel from '../model/activitytype.model.js';

const getAllActivityLogs = asyncWrapper(async (req, res) => {
    const { search, actionType, startDate, endDate } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    if (actionType && actionType !== "All") {
        const exists = await ActivityTypeModel.findOne({ name: actionType });
        if (!exists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "invalid action type"
            });
        }
        query.actionType = actionType;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const totalRecords = await activityLogModel.countDocuments(query);

    const activityLogs = await activityLogModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "activity logs fetched successfully",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit),
            totalRecords,
            limit
        },
        data: activityLogs
    });
});


const getSingleActivityLog = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const log = await activityLogModel.findById(id);
    if (!log) throw new NOT_FOUND("activity log not found");

    res.status(StatusCodes.OK).json({
        success: true,
        message: "activity log fetched successfully",
        data: [log]
    });
});

export { getAllActivityLogs, getSingleActivityLog };
