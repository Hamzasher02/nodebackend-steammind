import { NOT_FOUND } from "../error/error.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import deletionHistoryModel from "../model/deletionhistory.model.js";

const getAllDeletionHistory = asyncWrapper(async (req, res) => {
    const { type, startDate, endDate, page = 1 } = req.query;

    const query = {};

    if (type && type !== "All") {
        query.itemModel = type;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await deletionHistoryModel.countDocuments(query);

    if (!total) {
        throw new NOT_FOUND("No deletion history found for the given filters");
    }

    const history = await deletionHistoryModel
        .find(query)
        .populate("performedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        message: "Deletion history fetched successfully",
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            limit: limit,
        },
        data: history
    });
});

export { getAllDeletionHistory }
