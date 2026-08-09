import mongoose from "mongoose";

const deletionHistorySchema = new mongoose.Schema(
    {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        itemName: {
            type: String,
            required: true,
        },
        itemModel: {
            type: String,
            required: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            required: true,
        },
        affectedRefs: [
            {
                model: { type: String, required: true },
                refId: { type: mongoose.Schema.Types.ObjectId, required: true },
            },
        ],
    },
    { timestamps: true }
);

const deletionHistoryModel = mongoose.model(
    "DeletionHistory",
    deletionHistorySchema
);

export default deletionHistoryModel;
