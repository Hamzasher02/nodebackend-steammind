import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import courseFeedbackModel from "../model/coursefeedback.model.js";
import enrollmentModel from "../model/enrollment.model.js";
import courseModel from "../model/course.model.js";
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from "../error/error.js";

// Create course feedback
const createCourseFeedback = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const { feedbackText, rating } = req.body;
    const userId = req.user.userId;

    // Validate course exists
    const course = await courseModel.findOne({
        _id: courseId,
        isDeleted: false
    });

    if (!course) {
        throw new NOT_FOUND("Course not found");
    }

    // Check if user is enrolled and approved
    const enrollment = await enrollmentModel.findOne({
        user: userId,
        course: courseId,
        isDeleted: false,
        enrollmentStatus: 'approved'
    });

    if (!enrollment) {
        throw new UNAUTHORIZED("You must be enrolled and approved in this course to provide feedback");
    }

    // Check if user has already given feedback for this course
    const existingFeedback = await courseFeedbackModel.findOne({
        user: userId,
        course: courseId,
        isDeleted: false
    });

    if (existingFeedback) {
        throw new BAD_REQUEST("You have already provided feedback for this course");
    }

    // Create feedback
    const feedback = await courseFeedbackModel.create({
        user: userId,
        course: courseId,
        feedbackText: feedbackText.trim(),
        rating: rating || null
    });

    // Populate user and course details
    const populatedFeedback = await courseFeedbackModel
        .findById(feedback._id)
        .populate('user', 'firstName lastName email profilePicture')
        .populate('course', 'courseTitle courseThumbnail');

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Course feedback submitted successfully",
        data: populatedFeedback
    });
});

// Get all feedbacks for a specific course
const getCourseFeedbacks = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    // Validate course exists
    const course = await courseModel.findOne({
        _id: courseId,
        isDeleted: false
    });

    if (!course) {
        throw new NOT_FOUND("Course not found");
    }

    const feedbacks = await courseFeedbackModel
        .find({
            course: courseId,
            isDeleted: false
        })
        .populate('user', 'firstName lastName email profilePicture')
        .sort({ createdAt: -1 });

    if (feedbacks.length <= 0) {
        throw new NOT_FOUND("No feedbacks found for this course");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course feedbacks retrieved successfully",
        data: feedbacks
    });
});

// Get single feedback by ID
const getSingleFeedback = asyncWrapper(async (req, res) => {
    const { feedbackId } = req.params;

    const feedback = await courseFeedbackModel
        .findOne({
            _id: feedbackId,
            isDeleted: false
        })
        .populate('user', 'firstName lastName email profilePicture')
        .populate('course', 'courseTitle courseThumbnail');

    if (!feedback) {
        throw new NOT_FOUND("Feedback not found");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Feedback retrieved successfully",
        data: feedback
    });
});

// Get user's own feedback for a course
const getUserCourseFeedback = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Validate course exists
    const course = await courseModel.findOne({
        _id: courseId,
        isDeleted: false
    });

    if (!course) {
        throw new NOT_FOUND("Course not found");
    }

    const feedback = await courseFeedbackModel
        .findOne({
            user: userId,
            course: courseId,
            isDeleted: false
        })
        .populate('course', 'courseTitle courseThumbnail');

    if (!feedback) {
        throw new NOT_FOUND("You have not provided feedback for this course yet");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Your feedback retrieved successfully",
        data: feedback
    });
});

// Update user's own feedback
const updateCourseFeedback = asyncWrapper(async (req, res) => {
    const { feedbackId } = req.params;
    const { feedbackText, rating } = req.body;
    const userId = req.user.userId;

    const feedback = await courseFeedbackModel.findOne({
        _id: feedbackId,
        user: userId,
        isDeleted: false
    });

    if (!feedback) {
        throw new NOT_FOUND("Feedback not found or you don't have permission to update it");
    }

    // Update feedback
    if (feedbackText) {
        feedback.feedbackText = feedbackText.trim();
    }
    if (rating !== undefined) {
        feedback.rating = rating || null;
    }

    await feedback.save();

    // Populate and return updated feedback
    const updatedFeedback = await courseFeedbackModel
        .findById(feedback._id)
        .populate('user', 'firstName lastName email profilePicture')
        .populate('course', 'courseTitle courseThumbnail');

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Feedback updated successfully",
        data: updatedFeedback
    });
});

// Delete user's own feedback (soft delete)
const deleteCourseFeedback = asyncWrapper(async (req, res) => {
    const { feedbackId } = req.params;
    const userId = req.user.userId;

    const feedback = await courseFeedbackModel.findOne({
        _id: feedbackId,
        user: userId,
        isDeleted: false
    });

    if (!feedback) {
        throw new NOT_FOUND("Feedback not found or you don't have permission to delete it");
    }

    // Soft delete
    feedback.isDeleted = true;
    feedback.deletedAt = new Date();
    await feedback.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Feedback deleted successfully",
        data: feedback
    });
});

// Admin: Get all feedbacks (with optional course filter)
const getAllFeedbacks = asyncWrapper(async (req, res) => {
    const { courseId } = req.query;

    const filter = { isDeleted: false };
    if (courseId) {
        filter.course = courseId;
    }

    const feedbacks = await courseFeedbackModel
        .find(filter)
        .populate('user', 'firstName lastName email profilePicture')
        .populate('course', 'courseTitle courseThumbnail')
        .sort({ createdAt: -1 });

    if (feedbacks.length <= 0) {
        throw new NOT_FOUND("No feedbacks found");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All feedbacks retrieved successfully",
        data: feedbacks
    });
});

const getInstructorWiseAllCourseFeedback = asyncWrapper(async (req, res) => {
    const instructorId = req.user.userId; 
     
    const courses = await courseModel.find({
        'assignedInstructors.instructor': instructorId,
        isDeleted: false
    }).select('_id courseTitle courseThumbnail');

    if (!courses || courses.length === 0) {
        throw new NOT_FOUND("No courses found for this instructor");
    }

    const courseIds = courses.map(c => c._id);

    // Step 2: Fetch all feedbacks for these courses
    const feedbacks = await courseFeedbackModel.find({
        course: { $in: courseIds },
        isDeleted: false
    })
        .populate('user', 'firstName lastName email profilePicture')
        .populate('course', 'courseTitle courseThumbnail')
        .sort({ createdAt: -1 });

    if (!feedbacks || feedbacks.length === 0) {
        throw new NOT_FOUND("No feedbacks found for your courses");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Instructor course feedbacks retrieved successfully",
        data: feedbacks
    });
});

export {
    createCourseFeedback,
    getCourseFeedbacks,
    getSingleFeedback,
    getUserCourseFeedback,
    updateCourseFeedback,
    deleteCourseFeedback,
    getAllFeedbacks,
    getInstructorWiseAllCourseFeedback
};
