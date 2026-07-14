import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import demoSessionRequestModel from "../model/demosessionrequest.model.js";
import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";
import courseModel from "../model/course.model.js";
import categoryModel from "../model/category.model.js";
import userModel from "../model/user.model.js";
import instructorModel from "../model/instructor.model.js";

// Student: Create demo session request
const createDemoSessionRequest = asyncWrapper(async (req, res) => {
    const { courseId, preferredDate, preferredTime } = req.body;
    const studentId = req.user.userId;

    // Validate that user is a student
    const user = await userModel.findById(studentId);
    if (!user || user.role !== 'student') {
        throw new BAD_REQUEST("Only students can create demo session requests");
    }

    // Validate course exists and is published
    const course = await courseModel.findOne({ _id: courseId, isDeleted: false });
    if (!course) {
        throw new NOT_FOUND("Course not found");
    }

    // Validate course is published
    if (!course.isCoursePublished) {
        throw new BAD_REQUEST("Demo session can only be requested for published courses. This course is not published yet.");
    }

    // Check for duplicate demo session request
    // Prevent duplicate requests for the same course (pending or approved)
    // Allow re-request if previous request was rejected
    const existingRequest = await demoSessionRequestModel.findOne({
        studentId,
        courseId,
        status: { $in: ['pending', 'approved'] },
        isDeleted: false
    });

    if (existingRequest) {
        const statusMessage = existingRequest.status === 'pending' 
            ? 'pending approval' 
            : 'already approved';
        throw new BAD_REQUEST(`You have already requested a demo session for this course. Your request is currently ${statusMessage}. Please wait for the admin to process your request or check your existing demo session requests.`);
    }

    // Get category and subcategory from the course itself
    // courseCategory is an array, but handle both array and string cases
    let category = null;
    if (Array.isArray(course.courseCategory) && course.courseCategory.length > 0) {
        category = course.courseCategory[0];
    } else if (typeof course.courseCategory === 'string') {
        category = course.courseCategory;
    }
    
    let subcategory = course.courseSubCategory;

    if (!category || !subcategory) {
        throw new BAD_REQUEST("Course does not have valid category or subcategory. Please ensure the course has a category and subcategory assigned.");
    }

    // Clean and normalize category name - remove trailing commas, semicolons, and whitespace
    category = String(category)
        .trim()
        .replace(/[,;]+$/, '') // Remove trailing commas and semicolons
        .trim();
    
    // Clean and normalize subcategory name - remove trailing commas, semicolons, and whitespace
    subcategory = String(subcategory)
        .trim()
        .replace(/[,;]+$/, '') // Remove trailing commas and semicolons
        .trim();

    if (!category || !subcategory) {
        throw new BAD_REQUEST("Course category or subcategory is empty after cleaning. Please ensure the course has valid category or subcategory values.");
    }

    // Validate category exists in database (case-insensitive search)
    // Escape special regex characters in category name
    const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const categoryExists = await categoryModel.findOne({ 
        categoryName: { $regex: new RegExp(`^${escapedCategory}$`, 'i') },
        isDeleted: false 
    });

    if (!categoryExists) {
        // Try to find all categories to help with debugging
        const allCategories = await categoryModel.find({ isDeleted: false }).select('categoryName');
        const categoryNames = allCategories.map(c => c.categoryName).join(', ');
        throw new NOT_FOUND(`Category "${category}" not found in system. Available categories: ${categoryNames || 'None'}`);
    }

    // Use the actual category name from database (to handle case differences)
    const actualCategoryName = categoryExists.categoryName;

    // Validate subcategory belongs to category
    if (!categoryExists.subCategory || !categoryExists.subCategory.length) {
        throw new BAD_REQUEST(`Category "${actualCategoryName}" does not have any subcategories defined.`);
    }

    // Normalize subcategory - clean trailing commas/semicolons from array items too
    const normalizedSubcategory = subcategory.trim();
    
    // Check if subcategory exists in the category's subCategory array
    // Also clean the subcategories from the array for comparison
    const cleanedSubcategories = categoryExists.subCategory.map(sc => 
        String(sc).trim().replace(/[,;]+$/, '').trim()
    );
    
    const subcategoryIndex = cleanedSubcategories.findIndex(sc => 
        sc.toLowerCase() === normalizedSubcategory.toLowerCase()
    );
    
    if (subcategoryIndex === -1) {
        const availableSubcategories = categoryExists.subCategory.join(', ');
        throw new BAD_REQUEST(`Subcategory "${normalizedSubcategory}" does not belong to category "${actualCategoryName}". Available subcategories: ${availableSubcategories}`);
    }
    
    // Use the cleaned subcategory name (from cleanedSubcategories array)
    const actualSubcategoryName = cleanedSubcategories[subcategoryIndex];

    // Use the actual category name from database
    category = actualCategoryName;

    // Validate date is in the future
    const preferredDateObj = new Date(preferredDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to compare dates only
    preferredDateObj.setHours(0, 0, 0, 0);
    
    if (preferredDateObj < now) {
        throw new BAD_REQUEST("Preferred date must be in the future");
    }

    // Create demo session request with cleaned category and subcategory from course
    const demoSessionRequest = await demoSessionRequestModel.create({
        studentId,
        category: actualCategoryName, // Use the actual category name from database
        subcategory: actualSubcategoryName, // Use the actual subcategory name from database
        courseId,
        preferredDate: new Date(preferredDate),
        preferredTime,
        status: 'pending'
    });

    // Populate course data for response
    const populatedRequest = await demoSessionRequestModel
        .findById(demoSessionRequest._id)
        .populate('course', 'courseTitle courseThumbnail coursePrice courseCategory courseSubCategory');

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Demo session request created successfully",
        data: populatedRequest
    });
});

// Student: Get their demo session requests
const getStudentDemoSessionRequests = asyncWrapper(async (req, res) => {
    const studentId = req.user.userId;

    // Validate that user is a student
    const user = await userModel.findById(studentId);
    if (!user || user.role !== 'student') {
        throw new BAD_REQUEST("Only students can view their demo session requests");
    }

    const requests = await demoSessionRequestModel
        .find({ studentId, isDeleted: false })
        .populate('course', 'courseTitle courseThumbnail coursePrice courseCategory courseSubCategory')
        .populate('instructor', 'firstName lastName email profilePicture')
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Demo session requests retrieved successfully",
        data: requests
    });
});

// Instructor: Get their assigned demo sessions
const getInstructorDemoSessions = asyncWrapper(async (req, res) => {
    const instructorId = req.user.userId;

    // Validate that user is an instructor
    const user = await userModel.findById(instructorId);
    if (!user || user.role !== 'instructor') {
        throw new BAD_REQUEST("Only instructors can view their demo sessions");
    }

    const sessions = await demoSessionRequestModel
        .find({ instructorId, status: 'approved', isDeleted: false })
        .populate('student', 'firstName lastName email phoneNumber profilePicture')
        .populate('course', 'courseTitle courseThumbnail coursePrice courseCategory courseSubCategory')
        .sort({ approvedDate: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Demo sessions retrieved successfully",
        data: sessions
    });
});

// Admin: Get all demo session requests
const getAllDemoSessionRequests = asyncWrapper(async (req, res) => {
    // Support both GET (query params) and POST (body)
    const { status } = req.body?.status ? req.body : req.query;
    
    const filter = { isDeleted: false };
    if (status) {
        filter.status = status;
    }

    const requests = await demoSessionRequestModel
        .find(filter)
        .populate({
            path: 'student',
            select: 'firstName lastName email phoneNumber profilePicture',
            populate: {
                path: 'student',
                select: 'grade age parentPhoneNumber'
            }
        })
        .populate('course', 'courseTitle courseThumbnail coursePrice courseCategory courseSubCategory courseLevel courseAgeGroup courseAccess')
        .populate('instructor', 'firstName lastName email profilePicture')
        .populate('approvedBy', 'firstName lastName email')
        .populate('rejectedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Demo session requests retrieved successfully",
        data: requests
    });
});

// Admin: Approve and assign instructor to demo session request
const approveAndAssignInstructor = asyncWrapper(async (req, res) => {
    const { requestId } = req.params;
    const { instructorId, demoSessionLink } = req.body;
    const adminId = req.user.userId;

    if (!instructorId || !demoSessionLink) {
        throw new BAD_REQUEST("Instructor ID and demo session link are required");
    }

    // Validate request exists and is pending
    const request = await demoSessionRequestModel.findOne({ _id: requestId, isDeleted: false });
    if (!request) {
        throw new NOT_FOUND("Demo session request not found");
    }

    if (request.status !== 'pending') {
        throw new BAD_REQUEST(`Demo session request is already ${request.status}`);
    }

    // Validate instructor exists and is an instructor
    const instructorUser = await userModel.findById(instructorId);
    if (!instructorUser || instructorUser.role !== 'instructor') {
        throw new BAD_REQUEST("Invalid instructor ID");
    }

    const instructor = await instructorModel.findOne({ createdBy: instructorId });
    if (!instructor) {
        throw new NOT_FOUND("Instructor profile not found");
    }

    // Update request - approve and assign instructor
    request.status = 'approved';
    request.instructorId = instructorId;
    request.demoSessionLink = demoSessionLink;
    request.approvedDate = request.preferredDate;
    request.approvedBy = adminId;
    await request.save();

    // Get populated request with all details
    const updatedRequest = await demoSessionRequestModel
        .findById(requestId)
        .populate({
            path: 'student',
            select: 'firstName lastName email phoneNumber profilePicture',
            populate: {
                path: 'student',
                select: 'grade age parentPhoneNumber'
            }
        })
        .populate('course', 'courseTitle courseThumbnail coursePrice courseCategory courseSubCategory courseLevel courseAgeGroup courseAccess')
        .populate('instructor', 'firstName lastName email profilePicture')
        .populate('approvedBy', 'firstName lastName email');

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Demo session request approved and instructor assigned successfully",
        data: updatedRequest
    });
});

export {
    createDemoSessionRequest,
    getStudentDemoSessionRequests,
    getInstructorDemoSessions,
    getAllDemoSessionRequests,
    approveAndAssignInstructor
};
