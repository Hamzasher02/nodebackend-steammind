import { StatusCodes } from "http-status-codes";
import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import courseModel from "../model/course.model.js";
import courseModuleModel from "../model/coursemodule.model.js";
import courseLectureModel from "../model/courselecture.model.js";
import pdfMaterialModel from "../model/coursepdfmaterials.model.js";
import deletionHistoryModel from "../model/deletionhistory.model.js";
const createCourseModule = asyncWrapper(async (req, res) => {
    const { courseId, moduleName, moduleDescription, noOfSession, sessionDuration } = req.body;
    const course = await courseModel.findOne({ _id: courseId })
    if (!course) throw new BAD_REQUEST("Please provide valid courseId")
    let objectToSave = {}
    if (moduleDescription) objectToSave.moduleDescription = moduleDescription;
    if (noOfSession) objectToSave.noOfSession = noOfSession;
    if (sessionDuration) objectToSave.sessionDuration = sessionDuration;
    objectToSave.moduleName = moduleName;
    objectToSave.createdBy = req.user.userId
    objectToSave.moduleCourse = course._id
    const totalCourseModule = await courseModuleModel.countDocuments({ moduleCourse: courseId })
    objectToSave.moduleIndex = totalCourseModule + 1;
    const courseModule = await courseModuleModel.create(objectToSave)
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course module created successfully",
        data: courseModule
    })
})
const updateCourseModule = asyncWrapper(async (req, res) => {
    const { moduleName, moduleDescription, noOfSession, sessionDuration } = req.body;
    const { courseId, courseModuleId } = req.params
    const course = await courseModel.findOne({ _id: courseId, isDeleted: false })
    if (!course) throw new BAD_REQUEST("Please provide valid courseId")
    const courseModuleExist = await courseModuleModel.findOne({ _id: courseModuleId, moduleCourse: courseId })
    if (!courseModuleExist) throw new NOT_FOUND("No module found please provide a valid module id.");
    let objectToUpdate = {}
    if (moduleDescription) objectToUpdate.moduleDescription = moduleDescription;
    if (noOfSession) objectToUpdate.noOfSession = noOfSession;
    if (sessionDuration) objectToUpdate.sessionDuration = sessionDuration;
    if (moduleName) objectToUpdate.moduleName = moduleName;
    const updatedModule = await courseModuleModel.findOneAndUpdate({ _id: courseModuleId, moduleCourse: courseId }, objectToUpdate, { runValidators: true, new: true })
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course module updated successfully",
        data: updatedModule
    })
})
const getAllCourseModule = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const course = await courseModel.findOne({ _id: courseId, isDeleted: false })
    if (!course) throw new NOT_FOUND("no new course exist with this id")
    const courseModuleExist = await courseModuleModel.find({ moduleCourse: courseId, isDeleted: false }).sort("moduleIndex");
    if (courseModuleExist.length <= 0) throw new NOT_FOUND("No module found please provide a valid module id.");

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All course modules",
        data: courseModuleExist
    })
})
const getSingleCourseModule = asyncWrapper(async (req, res) => {
    const { courseId, courseModuleId } = req.params;
    const courseModuleExist = await courseModuleModel.findOne({ moduleCourse: courseId, _id: courseModuleId,isDeleted:false })
    if (!courseModuleExist) throw new NOT_FOUND("No module found please provide a valid module id.");
    res.status(StatusCodes.OK).json({
        success: true,
        message: "singel Course module.",
        data: courseModuleExist
    })
})
const getSingleCourseModuleUserSide = asyncWrapper(async (req, res) => {
    const { courseId, courseModuleId } = req.params;
    const course = await courseModel.findOne({ _id: courseId, isDeleted: false })
    if (!course) throw new BAD_REQUEST("no course exist with this id")
    if (course.isCoursePublished === false) throw new BAD_REQUEST("course is not yet published so you can not access its module")
    const courseModuleExist = await courseModuleModel.findOne({ moduleCourse: courseId, _id: courseModuleId })
    if (!courseModuleExist) throw new NOT_FOUND("No module found please provide a valid module id.");
    res.status(StatusCodes.OK).json({
        success: true,
        message: "singel Course module.",
        data: courseModuleExist
    })
})
const updateIndexOfCourseModule = asyncWrapper(async (req, res) => {
    const { courseId } = req.params
    const { courseModuleWhoseIndexToBeUpdated, courseModuleWithWhichIndexToBeSwapped } = req.body;
    const courseModuleExistOne = await courseModuleModel.findOne({ moduleCourse: courseId, _id: courseModuleWhoseIndexToBeUpdated, isDeleted: false })
    const courseModuleExisTwo = await courseModuleModel.findOne({ moduleCourse: courseId, _id: courseModuleWithWhichIndexToBeSwapped, isDeleted: false })
    if (!courseModuleExistOne || !courseModuleExisTwo) throw new NOT_FOUND("No module found please provide a valid module id.");
    const indexOne = courseModuleExistOne.moduleIndex
    const indexTwo = courseModuleExisTwo.moduleIndex
    courseModuleExistOne.moduleIndex = indexTwo
    courseModuleExisTwo.moduleIndex = indexOne
    await courseModuleExistOne.save()
    await courseModuleExisTwo.save()

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course module updated successfully",
        data: [courseModuleExistOne, courseModuleExisTwo]
    })
})


const deleteCourseModule = asyncWrapper(async (req, res) => {
    const { courseId, courseModuleId } = req.body;
    const adminId = req.user.userId;
    const module = await courseModuleModel.findOne({ _id: courseModuleId, moduleCourse: courseId, isDeleted: false });
    if (!module) throw new NOT_FOUND("No module found or it may already be deleted");
    const isAnyLectureExist = await courseLectureModel.findOne({ moduleItBelongTo: module._id })
    if (isAnyLectureExist) throw new BAD_REQUEST("Please delete all lecture Permanenetly before deleting the module")
    const isAnyPdfExist = await pdfMaterialModel.findOne({ moduleItBelongTo: module._id })
    if (isAnyPdfExist) throw new BAD_REQUEST("Please delete the pdf material permanently related to this module first")
    module.isDeleted = true;
    module.deletedAt = new Date();
    module.deletedBy = adminId;
    await module.save();
    await deletionHistoryModel.create({
        itemId: module._id,
        itemName: module.moduleName,
        itemModel: "CourseModule",
        performedBy: adminId,
        affectedRefs: [],
    });
    res.status(200).json({
        success: true,
        message: "Course module moved to trash (soft deleted).",
        data: module,
    });
});
const restoreCourseModule = asyncWrapper(async (req, res) => {
    const { courseModuleId } = req.body;
    const adminId = req.user.userId;
    const history = await deletionHistoryModel.findOne({
        itemId: courseModuleId,
        itemModel: "CourseModule",
    }).sort({ createdAt: -1 });
    if (!history) throw new NOT_FOUND("No deletion history found for this module");
    const module = await courseModuleModel.findById(courseModuleId);
    if (!module) throw new NOT_FOUND("Course module not found");
    module.isDeleted = false;
    module.deletedAt = null;
    module.deletedBy = null;
    module.restoredAt = new Date();
    module.restoredBy = adminId;
    await module.save();
    await history.deleteOne();

    res.status(200).json({
        success: true,
        message: "Course module restored successfully",
        data: module,
    });
});
const deleteCourseModulePermanently = asyncWrapper(async (req, res) => {
    const { courseModuleId } = req.params;
    const module = await courseModuleModel.findOne({ _id: courseModuleId, isDeleted: true });
    if (!module) throw new NOT_FOUND("Course module not found or is not in trash");
    await module.deleteOne();
    await deletionHistoryModel.deleteMany({
        itemId: courseModuleId,
        itemModel: "CourseModule",
    });
    res.status(200).json({
        success: true,
        message: "Course module permanently deleted",
        data: module,
    });
});

const getAllCourseModuleUserSide = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const course = await courseModel.findOne({ _id: courseId, isDeleted: false })
    if (!course) throw new BAD_REQUEST * "no course exist with this id"
    if (course.isCoursePublished === false) throw new BAD_REQUEST("course is not yet published so you can not access its module")
    const courseModuleExist = await courseModuleModel.find({ moduleCourse: courseId, isDeleted: false }).sort("moduleIndex");
    if (courseModuleExist.length <= 0) throw new NOT_FOUND("No module found please provide a valid module id.");

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All course modules",
        data: courseModuleExist
    })
})

import StudentModuleProgressModel from "../model/studentmoduleprogress.model.js";
import enrollmentModel from "../model/enrollment.model.js";

const getCourseModuleWithStatus = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.userId; // Extracted from token

    // 1. Verify Student is actually enrolled and approved in this course
    const enrollment = await enrollmentModel.findOne({
        user: studentId,
        course: courseId,
        enrollmentStatus: 'approved',
        isDeleted: false
    });

    if (!enrollment) {
        throw new BAD_REQUEST("You are not enrolled in this course or your enrollment is not approved.");
    }

    // 2. Get all modules for this specific course
    const modules = await courseModuleModel.find({
        moduleCourse: courseId,
        isDeleted: false
    }).sort("moduleIndex");

    // 3. Get the IDs of modules the student has already completed/progressed in
    // We filter by enrollment ID to be specific to this student's current journey
    const progressRecords = await StudentModuleProgressModel.find({
        student: studentId,
        course: courseId,
        enrollment: enrollment._id,
        isCompleted: true,
        isDeleted: false
    }).select('module');

    // Create a set of IDs for quick comparison
    const completedModuleIds = new Set(
        progressRecords.map(record => record.module.toString())
    );

    // 4. Map the modules to include all original data + the status flag
    const moduleData = modules.map(mod => {
        return {
            ...mod.toObject(),
            completedByStudent: completedModuleIds.has(mod._id.toString())
        };
    });

    res.status(StatusCodes.OK).json({
        success: true,
        count: moduleData.length,
        data: moduleData
    });
});
export { createCourseModule, updateCourseModule, deleteCourseModule, getAllCourseModule, getSingleCourseModule, updateIndexOfCourseModule, restoreCourseModule, deleteCourseModulePermanently, getAllCourseModuleUserSide, getSingleCourseModuleUserSide }