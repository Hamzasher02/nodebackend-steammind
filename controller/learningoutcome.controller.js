import { StatusCodes } from "http-status-codes";
import { NOT_FOUND } from "../error/error.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import courseModel from "../model/course.model.js";
import courseOverviewModel from "../model/courseoverview.model.js";
import courseLearningOutcomeModel from "../model/learningoutcome.model.js";
import deletionHistoryModel from "../model/deletionhistory.model.js";

const createCourseLearningOutcome = asyncWrapper(async (req, res) => {
    const { outcomeDescription, courseId } = req.body
    const course = await courseModel.findOne({ _id: courseId })
    if (!course) throw new NOT_FOUND("no course found with this courseId")

    const courseLearningOutcome = await courseLearningOutcomeModel.create(
        {
            outcomeDescription, belongTo: courseId, createdBy: req.user.userId
        }
    )
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course learning outcome created successfully",
        data: courseLearningOutcome
    })
})
const getAllCourseLearningOutcome = asyncWrapper(async (req, res) => {
    const { courseId } = req.params
    const course = await courseModel.findOne({ _id: courseId })
    if (!course) throw new NOT_FOUND("no course found with this courseId")
    const courseLearningOutcome = await courseLearningOutcomeModel.find({ belongTo: courseId,isDeleted:false })
    if (courseLearningOutcome.length <= 0) throw new NOT_FOUND("No outcome created yet")
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course learning outcomes.",
        data: courseLearningOutcome
    })
})
const updateCourseLearningOutcome = asyncWrapper(async (req, res) => {
    const { courseId, courseOutcomeId, outcomeDescription } = req.body
    const courseLearningOutcome = await courseLearningOutcomeModel.findOne({ belongTo: courseId, _id: courseOutcomeId })
    if (!courseLearningOutcome) throw new NOT_FOUND("no course outcome with this id exist")
    courseLearningOutcome.outcomeDescription = outcomeDescription;
    await courseLearningOutcome.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course learning outcome updated successfully.",
        data: courseLearningOutcome
    })
})


const deleteCourseLearningOutcome = asyncWrapper(async (req, res) => {
    const { courseId, courseOutcomeId } = req.body;
    const adminId = req.user.userId;
    console.log(courseId);
    console.log(courseOutcomeId);
    
    const outcome = await courseLearningOutcomeModel.findOne({ belongTo: courseId, _id: courseOutcomeId, isDeleted: false });
    console.log(outcome);
    
    if (!outcome) throw new NOT_FOUND("No course outcome with this id exists");
    outcome.isDeleted = true;
    outcome.deletedAt = new Date();
    outcome.deletedBy = adminId;
    await outcome.save();
    await deletionHistoryModel.create({
        itemId: outcome._id,
        itemName: `Course Outcome for Course: ${courseId}`,
        itemModel: "CourseLearningOutcome",
        performedBy: adminId,
        affectedRefs: [
        ],
    });
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course learning outcome moved to trash (soft deleted) and history created.",
        data: outcome,
    });
});


const restoreCourseLearningOutcome = asyncWrapper(async (req, res) => {
    const { courseOutcomeId } = req.params;
    const adminId = req.user.userId;
    const history = await deletionHistoryModel.findOne({
        itemId: courseOutcomeId,
        itemModel: "CourseLearningOutcome",
    }).sort({ createdAt: -1 });

    if (!history) throw new NOT_FOUND("No deletion history found for this outcome");
    const outcome = await courseLearningOutcomeModel.findById(courseOutcomeId);
    outcome.isDeleted = false;
    outcome.deletedAt = null;
    outcome.deletedBy = null;
    outcome.restoredAt = new Date();
    outcome.restoredBy = adminId;
    await outcome.save();
    await history.deleteOne();

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course learning outcome restored successfully and history removed.",
        data: outcome,
    });
});


const deleteCourseLearningOutcomePermanently = asyncWrapper(async (req, res) => {
    const { courseOutcomeId } = req.params;
    console.log(courseOutcomeId);
    
    const outcome = await courseLearningOutcomeModel.findOne({_id:courseOutcomeId,isDeleted:true});
    if (!outcome) throw new NOT_FOUND("No course outcome found with this id.");
    await outcome.deleteOne();
    await deletionHistoryModel.deleteMany({
        itemId: courseOutcomeId,
        itemModel: "CourseLearningOutcome",
    });
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course learning outcome permanently deleted.",
        data: outcome,
    });
});

export { createCourseLearningOutcome, updateCourseLearningOutcome, deleteCourseLearningOutcome, getAllCourseLearningOutcome, restoreCourseLearningOutcome, deleteCourseLearningOutcomePermanently }