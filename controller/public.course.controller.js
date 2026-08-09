import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import courseModel from "../model/course.model.js";
import courseModuleModel from "../model/coursemodule.model.js";
import courseLearningOutcomeModel from "../model/learningoutcome.model.js";
import courseFeedbackModel from "../model/coursefeedback.model.js";
import instructorModel from "../model/instructor.model.js";
import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";

// Public - List courses with pagination, search and basic filters
const getPublicCourses = asyncWrapper(async (req, res) => {
    const { search, courseCategory, courseSubCategory, courseLevel, page = 1, limit = 10 } = req.query;

    const match = {
        isCoursePublished: true,
        courseVisibility: true,
        isDeleted: false
    };

    if (courseCategory) match.courseCategory = courseCategory;
    if (courseSubCategory) match.courseSubCategory = courseSubCategory;
    if (courseLevel) match.courseLevel = courseLevel;

    if (search) {
        match.courseTitle = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page) || 1;
    const lim = parseInt(limit) || 10;
    const skip = (pageNum - 1) * lim;

    // Aggregation to include average rating and review count without extra queries per item
    const pipeline = [
        { $match: match },
        {
            $lookup: {
                from: 'coursefeedbacks',
                localField: '_id',
                foreignField: 'course',
                as: 'feedbacks'
            }
        },
        {
            $addFields: {
                averageRating: { $avg: '$feedbacks.rating' },
                reviewsCount: { $size: '$feedbacks' }
            }
        },
        {
            $project: {
                courseTitle: 1,
                coursePrice: 1,
                courseThumbnail: 1,
                courseOverview: 1,
                courseSubCategory: 1,
                courseCategory: 1,
                courseLevel: 1,
                averageRating: { $ifNull: ["$averageRating", null] },
                reviewsCount: 1,
                createdAt: 1
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: lim }
    ];

    const results = await courseModel.aggregate([
        { $match: match },
        {
            $lookup: {
                from: 'coursefeedbacks',
                localField: '_id',
                foreignField: 'course',
                as: 'feedbacks'
            }
        },
        {
            $addFields: {
                averageRating: { $avg: '$feedbacks.rating' },
                reviewsCount: { $size: '$feedbacks' }
            }
        },
        {
            $project: {
                courseTitle: 1,
                coursePrice: 1,
                courseThumbnail: 1,
                courseOverview: 1,
                courseSubCategory: 1,
                courseCategory: 1,
                courseLevel: 1,
                averageRating: { $ifNull: ["$averageRating", null] },
                reviewsCount: 1,
                createdAt: 1
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: lim }
    ]);

    // total count for pagination
    const total = await courseModel.countDocuments(match);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Public courses retrieved successfully",
        data: results,
        pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / lim),
            totalCourses: total,
            limit: lim
        }
    });
});

// Public - Get full course detail (only published courses)
const getPublicCourseDetail = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    if (!courseId) throw new BAD_REQUEST("course id is required");

    const course = await courseModel.findOne({ _id: courseId, isCoursePublished: true, isDeleted: false })
        .populate('createdBy', 'firstName lastName email profilePicture')
        .populate('assignedInstructors.instructor', 'firstName lastName profilePicture');

    if (!course) throw new NOT_FOUND("no course exist");

    // Fetch related items: modules, learning outcomes, feedbacks
    const [modules, outcomes, feedbacks] = await Promise.all([
        courseModuleModel.find({ moduleCourse: courseId, isDeleted: false }).sort({ createdAt: 1 }),
        courseLearningOutcomeModel.find({ belongTo: courseId, isDeleted: false }).sort({ createdAt: 1 }),
        courseFeedbackModel.find({ course: courseId, isDeleted: false }).populate('user', 'firstName lastName profilePicture').sort({ createdAt: -1 })
    ]);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course detail retrieved successfully",
        data: {
            course,
            curriculum: modules,
            learningOutcomes: outcomes,
            feedbacks
        }
    });
});

export { getPublicCourses, getPublicCourseDetail };
