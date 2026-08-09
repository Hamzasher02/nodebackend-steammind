import { BAD_REQUEST, NOT_FOUND,UNAUTHORIZED } from "../error/error.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import courseModel from "../model/course.model.js";
import courseLectureModel from "../model/courselecture.model.js";
import courseModuleModel from "../model/coursemodule.model.js";
import { deleteFromCloud, generateSignedUrl, uploadLargeFiles } from "../services/cloudinary.uploader.services.js";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";
import mongo from 'mongoose'
import enrollmentModel from "../model/enrollment.model.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import deletionHistoryModel from "../model/deletionhistory.model.js";
const createLecture = asyncWrapper(async (req, res) => {
    const { title, courseId, moduleId } = req.body;
    const createdBy = req.user.userId;
    if (!req.file || !req.file.path) throw new BAD_REQUEST("Please provide lecture file");
    if (!title || !courseId || !moduleId) {
        throw new BAD_REQUEST("Please provide title, course ID, and module ID");
    }
    const doesCourseExist = await courseModel.findById(courseId);
    if (!doesCourseExist) throw new NOT_FOUND(`No course found with id: ${courseId}`);

    const isModuleExist = await courseModuleModel.findOne({_id:moduleId,moduleCourse:courseId});
    if (!isModuleExist) throw new NOT_FOUND(`No module found with id: ${moduleId}`);
    const { publicId, secureUrl, bytes, width, height, duration } = await uploadLargeFiles(req.file.path);
    if (!publicId || !secureUrl || !bytes || !width || !height || !duration) {
        if (publicId) await deleteFromCloud(publicId); 
        throw new BAD_REQUEST("Upload failed or file metadata missing");
    }

    const resolution = `${width}x${height}`;

    try {
        const newLecture = await courseLectureModel.create({
            lectureCourse: courseId,
            moduleItBelongTo: moduleId, 
            createdBy,
            title,
            duration,
            resolution,
            fileSize: `${(bytes / (1024 * 1024)).toFixed(2)} MB`,
            lectureInfo: {
                secureUrl,
                publicId,
            },
        });

        cleanupUploadedFiles(req);

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Lecture uploaded and assigned to module successfully",
            lecture: newLecture,
        });
    } catch (error) {
        await deleteFromCloud(publicId);
        throw error;
    }
});

const updateLectureTitle = asyncWrapper(async (req, res) => {
    const { title } = req.body;
    const { courseId, lectureId } = req.params
    const doesCourseExist = await courseModel.findOne({ _id: courseId });
    if (!doesCourseExist) throw new NOT_FOUND(`No course found with this id: ${courseId}`);
    const doesLectureExist = await courseLectureModel.findOne({ _id: lectureId, lectureCourse: courseId })
    if (!doesLectureExist) throw new NOT_FOUND("no lecture found")

    doesLectureExist.title = title
    await doesLectureExist.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Lecture updated successfully",
        lecture: doesLectureExist,
    });
})
const getSingleLecture = asyncWrapper(async (req, res) => {

    const { courseId, lectureId } = req.params
    const doesCourseExist = await courseModel.findOne({ _id: courseId });
    if (!doesCourseExist) throw new NOT_FOUND(`No course found with this id: ${courseId}`);
    const doesLectureExist = await courseLectureModel.findOne({ _id: lectureId, lectureCourse: courseId })
    if (!doesLectureExist) throw new NOT_FOUND("no lecture found")
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course Single lecture",
        lecture: doesLectureExist,
    });
})

const getAllLectures = asyncWrapper(async (req, res) => {
    const { courseId } = req.params
    const doesCourseExist = await courseModel.findOne({ _id: courseId });
    if (!doesCourseExist) throw new NOT_FOUND(`No course found with this id: ${courseId}`);
    const doesLectureExist = await courseLectureModel.find({ lectureCourse: courseId })
    if (doesLectureExist.length <= 0) throw new NOT_FOUND("no lecture found")

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All Lectrues",
        lecture: doesLectureExist,
    });
})

//this lecture is to delete from course and send to delete history so we can not get it anymore until restore
const deleteLecture = asyncWrapper(async (req, res) => {
    const { courseId, lectureId } = req.params;
    const adminId = req.user.userId;
    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND(`No course found with this id: ${courseId}`);
    const lecture = await courseLectureModel.findOne({
        _id: lectureId,
        lectureCourse: courseId,
        isDeleted: false,
    });
    if (!lecture) throw new NOT_FOUND("No lecture found");

    lecture.isDeleted = true;
    lecture.deletedBy = adminId;
    lecture.deletedAt = new Date();
    await lecture.save();

    await deletionHistoryModel.create({
        itemId: lecture._id,
        itemName: lecture.title,
        itemModel: "CourseLecture",
        performedBy: adminId,
        affectedRefs: [],
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Lecture moved to trash successfully",
        lecture,
    });
});
const restoreLecture = asyncWrapper(async (req, res) => {
    const { lectureId } = req.body;
    const adminId = req.user.userId;

    const history = await deletionHistoryModel.findOne({
        itemId: lectureId,
        itemModel: "CourseLecture",
    }).sort({ createdAt: -1 });

    if (!history) throw new NOT_FOUND("No deletion history found for this lecture");

    const lecture = await courseLectureModel.findById(lectureId);
    if (!lecture) throw new NOT_FOUND("Lecture not found");

    lecture.isDeleted = false;
    lecture.deletedAt = null;
    lecture.deletedBy = null;
    lecture.restoredAt = new Date();
    lecture.restoredBy = adminId;
    await lecture.save();
    await history.deleteOne();

    res.status(200).json({
        success: true,
        message: "Lecture restored successfully",
        lecture,
    });
});
const deleteLecturePermanently = asyncWrapper(async (req, res) => {
    const { lectureId } = req.params;

    const lecture = await courseLectureModel.findOne({ _id: lectureId, isDeleted: true });
    if (!lecture) throw new NOT_FOUND("No lecture found or it is not in trash");

    await deleteFromCloud(lecture.lectureInfo.publicId);
    await lecture.deleteOne();

    await deletionHistoryModel.deleteMany({
        itemId: lectureId,
        itemModel: "CourseLecture",
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Lecture permanently deleted",
        lecture,
    });
});

const getAllLecturesByModule = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    if (!courseId) {
        throw new BAD_REQUEST("Please provide a courseId to fetch grouped lectures");
    }

    const groupedLectures = await courseLectureModel.aggregate([
        {
            $match: {
                lectureCourse: new mongo.Types.ObjectId(courseId),
                isDeleted: false
            }
        },
        {
            $lookup: {
                from: 'coursemodules', 
                localField: 'moduleItBelongTo',
                foreignField: '_id',
                as: 'moduleDetails'
            }
        },
        { $unwind: '$moduleDetails' },
        {
            $group: {
                _id: '$moduleItBelongTo',
                moduleName: { $first: '$moduleDetails.moduleName' }, 
                lectures: {
                    $push: {
                        _id: '$_id',
                        title: '$title',
                        duration: '$duration',
                        resolution: '$resolution',
                        fileSize: '$fileSize',
                        lectureInfo: '$lectureInfo',
                        createdAt: '$createdAt'
                    }
                }
            }
        },
        {
            $sort: { moduleName: 1 }
        }
    ]);

    if (!groupedLectures || groupedLectures.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No lectures found for this course",
            data: []
        });
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Lectures successfully grouped by module",
        count: groupedLectures.length,
        data: groupedLectures,
    });
});

const getAllLecturesStudentSideModuleWise = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const isEnrolled = await enrollmentModel.findOne({
        user: userId,
        course: courseId,
        enrollmentStatus: 'approved',
        isDeleted: false
    });

    if (!isEnrolled) {
        throw new UNAUTHORIZED("You must be enrolled in this course and have an approved payment to view lectures.");
    }
    const courseContent = await courseModuleModel.aggregate([
        {
            $match: {
                moduleCourse: new mongoose.Types.ObjectId(courseId),
                isDeleted: false
            }
        },
        { $sort: { moduleIndex: 1 } },
        {
            $lookup: {
                from: 'courselectures',
                let: { moduleId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$moduleItBelongTo', '$$moduleId'] },
                                    { $eq: ['$isDeleted', false] }
                                ]
                            }
                        }
                    },
                    { $sort: { createdAt: 1 } } 
                ],
                as: 'lectures'
            }
        },
        {
            $project: {
                moduleName: 1,
                moduleDescription: 1,
                moduleIndex: 1,
                completed: 1,
                lectures: {
                    _id: 1,
                    title: 1,
                    duration: 1,
                }
            }
        }
    ]);

    if (!courseContent || courseContent.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Course structure is being prepared.",
            data: []
        });
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course curriculum retrieved successfully",
        data: courseContent
    });
});

const getSingleLectureStudentSide = asyncWrapper(async (req, res) => {
    const { lectureId } = req.params;
    const userId = req.user.userId;
    const lecture = await courseLectureModel.findOne({ 
        _id: lectureId, 
        isDeleted: false 
    });

    if (!lecture) throw new NOT_FOUND("Lecture not found.");
    const enrollment = await enrollmentModel.findOne({
        user: userId,
        course: lecture.lectureCourse, 
        enrollmentStatus: 'approved',
        isDeleted: false
    });

    if (!enrollment) {
        throw new UNAUTHORIZED("You do not have access to this lecture. Please check your payment status.");
    }
 

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Lecture access granted",
        data: {
            title: lecture.title,
            duration: lecture.duration,
            resolution: lecture.resolution,
            LecturePublicId:lecture.lectureInfo.publicId,
            LectureSecureUrl:lecture.lectureInfo.secureUrl,
            courseId: lecture.lectureCourse,
            moduleId: lecture.moduleItBelongTo
        }
    });
});


export { createLecture, updateLectureTitle, getSingleLecture, getAllLectures, deleteLecture, restoreLecture, deleteLecturePermanently,getAllLecturesByModule,getAllLecturesStudentSideModuleWise,getSingleLectureStudentSide };
