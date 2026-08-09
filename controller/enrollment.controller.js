import moment from 'moment';
import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import enrollmentModel from "../model/enrollment.model.js";
import courseModel from "../model/course.model.js";
import courseModuleModel from "../model/coursemodule.model.js";
import courseLectureModel from "../model/courselecture.model.js";
import courseSessionModel from "../model/coursesession.model.js";
import pdfMaterialModel from "../model/coursepdfmaterials.model.js";
import courseLearningOutcomeModel from "../model/learningoutcome.model.js";
import { uploadToCloud as uploadPaymentScreenshot, deleteFromCloud } from "../services/cloudinary.uploader.services.js";
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from "../error/error.js";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";
import CourseSessionModel from '../model/coursesession.model.js';

const createEnrollment = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    
    const { enrollmentType, preferredClassTime, invoiceNumber } = req.body;
    // Validate course exists
    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found");

    // Check if course is published
    if (!course.isCoursePublished) {
        throw new BAD_REQUEST("Cannot enroll in an unpublished course");
    }

    // Validate enrollment type requirements
    if (enrollmentType === 'Live Classes' && !preferredClassTime) {
        throw new BAD_REQUEST("Preferred class time is required for Live Classes");
    }
    if (enrollmentType === 'Live Classes' && course.courseEnrollementType !== 'live') {
        throw new BAD_REQUEST("recorded course can not be enrolled in live classed");
    }
    if (enrollmentType === 'Recorded Lectures' && course.courseEnrollementType !== 'recorded') {
        throw new BAD_REQUEST("live course can not be enrolled in recroded lectures");
    }

    // Check if user already enrolled
    const existingEnrollment = await enrollmentModel.findOne({
        user: req.user.userId,
        course: courseId,
        isDeleted: false
    });

    if (existingEnrollment) {
        throw new BAD_REQUEST("You are already enrolled in this course");
    }

    // Validate payment screenshot file
    if (!req.file) {
        throw new BAD_REQUEST("Payment screenshot is required");
    }

    if (!req.file.mimetype.startsWith("image/")) {
        throw new BAD_REQUEST("Payment screenshot must be an image file");
    }

    if (req.file.size > 5 * 1024 * 1024) {
        throw new BAD_REQUEST("Payment screenshot size must not exceed 5 MB");
    }

    let publicIdPaymentScreenshot = null;

    try {
        // Upload payment screenshot to Cloudinary
        const paymentScreenshotCloud = await uploadPaymentScreenshot(req.file.path);
        publicIdPaymentScreenshot = paymentScreenshotCloud.publicId;

        if (!publicIdPaymentScreenshot || !paymentScreenshotCloud.secureUrl) {
            throw new BAD_REQUEST("Unable to upload payment screenshot to the server");
        }

        const paymentScreenshotData = {
            publicId: paymentScreenshotCloud.publicId,
            secureUrl: paymentScreenshotCloud.secureUrl
        };

        // Create enrollment
        let enrollment;
        if (enrollmentType === 'Live Classes') {
            enrollment = await enrollmentModel.create({
                user: req.user.userId,
                course: courseId,
                enrollmentType,
                preferredClassTime,
                paymentScreenshot: paymentScreenshotData,
                invoiceNumber: invoiceNumber || null,
                enrollmentStatus: 'pending',
                isSessionAssigned: false
            });
        } else {
            enrollment = await enrollmentModel.create({
                user: req.user.userId,
                course: courseId,
                enrollmentType:"Recorded Lectures",
                preferredClassTime: null,
                paymentScreenshot: paymentScreenshotData,
                invoiceNumber: invoiceNumber || null,
                enrollmentStatus: 'pending',
                isSessionAssigned: true
            });
        }
        cleanupUploadedFiles(req);

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Enrollment request submitted successfully",
            data: enrollment
        });
    } catch (err) {
        if (publicIdPaymentScreenshot) {
            await deleteFromCloud(publicIdPaymentScreenshot);
        }
        throw err;
    }
});

const getUserEnrollments = asyncWrapper(async (req, res) => {
    const userId = req.user.userId;
    // Only return approved enrollments for students
    const enrollments = await enrollmentModel.find({
        user: userId,
        isDeleted: false,
        enrollmentStatus: 'approved'
    })
        .populate('course', 'courseTitle courseThumbnail coursePrice')
        .sort({ createdAt: -1 })
        .lean();

    if (enrollments.length <= 0) {
        throw new NOT_FOUND("No approved enrollments found");
    }

    // Compute simple progress per enrollment
    const results = [];
    for (const en of enrollments) {
        const course = en.course || {};
        let progress = { completed: 0, total: 0 };

        if (en.enrollmentType === 'Live Classes') {
            // For live classes, count completed sessions for this enrollment/student
            const completedSessions = await courseSessionModel.countDocuments({
                enrollment: en._id,
                student: userId,
                sessionStatus: 'completed',
                isDeleted: false
            });

            // Determine total sessions (take max totalSessions from session documents)
            const totalDocs = await courseSessionModel.find({ enrollment: en._id, isDeleted: false }).select('totalSessions').lean();
            const totals = totalDocs.map(d => d.totalSessions || 0);
            const totalSessions = totals.length > 0 ? Math.max(...totals) : 0;

            progress = { completed: completedSessions, total: totalSessions };
        } else {
            // For recorded lectures, use total lectures count; student-specific completed lectures not tracked yet
            const totalLectures = await courseLectureModel.countDocuments({ lectureCourse: course._id, isDeleted: false });
            progress = { completed: 0, total: totalLectures };
        }

        results.push({
            enrollmentId: en._id,
            course: {
                _id: course._id,
                courseTitle: course.courseTitle,
                courseThumbnail: course.courseThumbnail,
                coursePrice: course.coursePrice
            },
            enrollmentType: en.enrollmentType,
            enrollmentStatus: en.enrollmentStatus,
            progress
        });
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "User approved enrollments retrieved successfully",
        data: results
    });
});

const getSingleEnrollment = asyncWrapper(async (req, res) => {
    const { enrollmentId } = req.params;
    const { role, userId } = req.user;

    // Security: Students can only see their own, Admin/Staff see all
    const queryFilter = { _id: enrollmentId, isDeleted: false };
    if (role !== 'admin' && role !== 'staff') {
        queryFilter.user = userId;
    }

    const enrollment = await enrollmentModel.findOne(queryFilter)
        // 1. Populate User and their Profile (Student or Instructor)
        .populate({
            path: 'user',
            select: '-password', // Never send password even if hashed
            populate: [
                {
                    path: 'student',
                    model: 'Student'
                },
                {
                    path: 'instructor',
                    model: 'Instructor',
                    populate: { path: 'availability' } // Deep populate instructor availability
                }
            ]
        })
        // 2. Populate Course and its assigned staff/instructors
        .populate({
            path: 'course',
            populate: {
                path: 'assignedInstructors.instructor',
                select: 'firstName lastName email profilePicture'
            }
        })
        // 3. Populate Admin/Staff Audit Fields
        .populate('approvedBy', 'firstName lastName email')
        .populate('rejectedBy', 'firstName lastName email')
        .populate('deletedBy', 'firstName lastName email')
        .populate('restoredBy', 'firstName lastName email');

    if (!enrollment) {
        throw new NOT_FOUND("Enrollment not found or unauthorized access");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Enrollment with full data graph retrieved successfully",
        data: enrollment
    });
});

const checkEnrollmentStatus = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const enrollment = await enrollmentModel.findOne({
        user: userId,
        course: courseId,
        isDeleted: false,
        enrollmentStatus: 'approved'
    });

    if (!enrollment) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "User is not enrolled in this course",
            data: {
                isEnrolled: false
            }
        });
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "User is enrolled in this course",
        data: {
            isEnrolled: true,
            enrollment: enrollment
        }
    });
});


const getAllEnrollments = asyncWrapper(async (req, res) => {
    const {
        search,
        dateRange,
        category,
        courseId,
        type,
        status,
        isSessionAssigned,
        page = 1,
        limit = 10
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const filter = { isDeleted: false };

    // 1. Search Logic
    if (search) {
        filter.$or = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { _id: mongo.isValidObjectId(search) ? search : null }
        ].filter(condition => condition._id !== null);
    }

    // 2. Date Filtering
    if (dateRange === 'Last 30 Days') {
        filter.createdAt = { $gte: moment().subtract(30, 'days').startOf('day').toDate() };
    } else if (dateRange === 'Last 7 Days') {
        filter.createdAt = { $gte: moment().subtract(7, 'days').startOf('day').toDate() };
    }

    // 3. Basic Field Filtering
    if (type) filter.enrollmentType = type;
    if (status) filter.enrollmentStatus = status;
    if (courseId && mongo.isValidObjectId(courseId)) filter.course = courseId;

    // 4. Session Assignment Filtering
    // Converting string 'true'/'false' from query to actual Boolean
    if (isSessionAssigned) {
        filter.isSessionAssigned = isSessionAssigned === 'true';
    }

    // 5. Query Execution
    // Note: Category filtering is still done via post-processing because it's in a ref model
    let enrollments = await enrollmentModel.find(filter)
        .populate('user', 'firstName lastName email phoneNumber profilePicture')
        .populate({
            path: 'course',
            select: 'courseTitle courseThumbnail coursePrice courseCategory',
            match: category ? { courseCategory: category } : {}
        })
        .populate('approvedBy', 'firstName lastName email')
        .populate('rejectedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

    // 6. Post-populate filtering for Category
    let result = category
        ? enrollments.filter(enrollment => enrollment.course !== null)
        : enrollments;

    // 7. Manual Pagination for post-filtered results
    const totalCount = result.length;
    const paginatedData = result.slice(skip, skip + Number(limit));

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Enrollments retrieved successfully",
        count: totalCount,
        pagination: {
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
            currentPage: Number(page),
            limit: Number(limit)
        },
        data: paginatedData
    });
});

// Admin: Get pending enrollments only
const getPendingEnrollments = asyncWrapper(async (req, res) => {
    const enrollments = await enrollmentModel
        .find({
            isDeleted: false,
            enrollmentStatus: 'pending'
        })
        .populate('user', 'firstName lastName email phoneNumber profilePicture')
        .populate('course', 'courseTitle courseThumbnail coursePrice courseCategory courseSubCategory courseLevel courseAgeGroup')
        .sort({ createdAt: -1 });

    if (enrollments.length <= 0) {
        throw new NOT_FOUND("No pending enrollments found");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Pending enrollments retrieved successfully",
        data: enrollments
    });
});

// Admin: Approve enrollment
const updateEnrollmentStatus = asyncWrapper(async (req, res) => {
    const { enrollmentId } = req.params;
    const { status, rejectReason } = req.body;
    const adminId = req.user.userId;

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
        throw new BAD_REQUEST("Invalid status. Please provide 'approved' or 'rejected'.");
    }

    if (status === 'rejected' && (!rejectReason || rejectReason.trim() === '')) {
        throw new BAD_REQUEST("A reason is required to reject an enrollment.");
    }

    const enrollment = await enrollmentModel.findOne({
        _id: enrollmentId,
        isDeleted: false
    });

    if (!enrollment) {
        throw new NOT_FOUND("Enrollment not found");
    }

    if (enrollment.enrollmentStatus !== 'pending') {
        throw new BAD_REQUEST(`Enrollment has already been ${enrollment.enrollmentStatus}`);
    }

    if (status === 'approved') {
        enrollment.enrollmentStatus = 'approved';
        enrollment.approvedBy = adminId;
        enrollment.approvedAt = new Date();
        enrollment.rejectedBy = null;
        enrollment.rejectedAt = null;
        enrollment.rejectReason = null;
    } else {
        enrollment.enrollmentStatus = 'rejected';
        enrollment.rejectedBy = adminId;
        enrollment.rejectedAt = new Date();
        enrollment.rejectReason = rejectReason.trim();
        enrollment.approvedBy = null;
        enrollment.approvedAt = null;
    }

    await enrollment.save();
    const updatedEnrollment = await enrollmentModel
        .findById(enrollmentId)
        .populate('user', 'firstName lastName email phoneNumber profilePicture')
        .populate('course', 'courseTitle courseThumbnail coursePrice courseCategory')
        .populate('approvedBy rejectedBy', 'firstName lastName email');

    res.status(StatusCodes.OK).json({
        success: true,
        message: `Enrollment ${status} successfully`,
        data: updatedEnrollment
    });
});

// Get complete course data for enrolled user
const getEnrolledCourseData = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Check if user is enrolled and approved
    const enrollment = await enrollmentModel.findOne({
        user: userId,
        course: courseId,
        isDeleted: false,
        enrollmentStatus: 'approved'
    });

    if (!enrollment) {
        throw new UNAUTHORIZED("You must be enrolled and approved in this course to access course data");
    }

    // Get course details
    const course = await courseModel.findOne({
        _id: courseId,
        isDeleted: false
    });

    if (!course) {
        throw new NOT_FOUND("Course not found");
    }

    // Get all modules (sorted by moduleIndex, not deleted)
    const modules = await courseModuleModel
        .find({
            moduleCourse: courseId,
            isDeleted: false
        })
        .sort({ moduleIndex: 1 })
        .select('-createdBy -updatedAt -__v');

    // Get all lectures (not deleted)
    const lectures = await courseLectureModel
        .find({
            lectureCourse: courseId,
            isDeleted: false
        })
        .select('-createdBy -updatedAt -__v')
        .sort({ createdAt: 1 });

    // Get all PDF materials (not deleted)
    const pdfMaterials = await pdfMaterialModel
        .find({
            pdfCourse: courseId,
            isDeleted: false
        })
        .select('-createdBy -updatedAt -__v')
        .sort({ createdAt: 1 });

    // Get all learning outcomes (not deleted)
    const learningOutcomes = await courseLearningOutcomeModel
        .find({
            belongTo: courseId,
            isDeleted: false
        })
        .select('-createdBy -updatedAt -__v')
        .sort({ createdAt: 1 });

    // Prepare response data
    const courseData = {
        course: {
            _id: course._id,
            courseTitle: course.courseTitle,
            courseCategory: course.courseCategory,
            courseSubCategory: course.courseSubCategory,
            courseAgeGroup: course.courseAgeGroup,
            courseLevel: course.courseLevel,
            courseAccess: course.courseAccess,
            coursePrice: course.coursePrice,
            courseThumbnail: course.courseThumbnail,
            courseOutline: course.courseOutline,
            assignedInstructors: course.assignedInstructors,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        },
        enrollment: {
            _id: enrollment._id,
            enrollmentType: enrollment.enrollmentType,
            preferredClassTime: enrollment.preferredClassTime,
            enrollmentStatus: enrollment.enrollmentStatus,
            approvedAt: enrollment.approvedAt,
            createdAt: enrollment.createdAt
        },
        modules: modules,
        lectures: lectures,
        pdfMaterials: pdfMaterials,
        learningOutcomes: learningOutcomes
    };
    // Tailor response based on enrollment type and student-scoped data rules
    if (enrollment.enrollmentType === 'Live Classes') {
        // For live enrollments: hide recorded lectures and pdfs, include sessions created for this student
        courseData.lectures = [];
        courseData.pdfMaterials = [];

        const sessions = await courseSessionModel
            .find({ enrollment: enrollment._id, student: userId, isDeleted: false })
            .select('sessionDate startTime endTime sessionLink sessionNumber totalSessions sessionStatus')
            .sort({ sessionNumber: 1 })
            .lean();

        courseData.sessions = sessions;

        // Add student-specific module completion flag (not tracked yet, default false)
        courseData.modules = modules.map(m => ({ ...m, studentCompleted: false }));
    } else {
        // For recorded enrollments: hide live session links
        courseData.sessions = [];

        // Add student-specific module completion flag (not tracked yet, default false)
        courseData.modules = modules.map(m => ({ ...m, studentCompleted: false }));
    }
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course data retrieved successfully",
        data: courseData
    });
});

// Get module details with child lectures and PDFs (student-scoped)
const getModuleDetails = asyncWrapper(async (req, res) => {
    const { enrollmentId, moduleId } = req.params;
    const userId = req.user.userId;

    // Verify enrollment and approval
    const enrollment = await enrollmentModel.findOne({
        _id: enrollmentId,
        user: userId,
        isDeleted: false,
        enrollmentStatus: 'approved'
    });

    if (!enrollment) {
        throw new UNAUTHORIZED("You must be enrolled and approved to access module details");
    }

    // Get module details
    const module = await courseModuleModel.findOne({
        _id: moduleId,
        moduleCourse: enrollment.course,
        isDeleted: false
    }).select('-createdBy -updatedAt -__v').lean();

    if (!module) {
        throw new NOT_FOUND("Module not found");
    }

    // Get lectures in this module (no video URLs yet)
    const lectures = await courseLectureModel.find({
        lectureCourse: enrollment.course,
        isDeleted: false
    })
        .select('_id title duration resolution fileSize')
        .lean();

    // Get PDFs in this module (no secure URLs yet)
    const pdfMaterials = await pdfMaterialModel.find({
        pdfCourse: enrollment.course,
        isDeleted: false
    })
        .select('_id title')
        .lean();

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Module details retrieved",
        data: {
            module,
            lectures,
            pdfMaterials
        }
    });
});

// Get lecture video details with secure URL (only for Recorded enrollments)
const getLectureDetail = asyncWrapper(async (req, res) => {
    const { enrollmentId, moduleId, lectureId } = req.params;
    const userId = req.user.userId;

    // Verify enrollment and approval
    const enrollment = await enrollmentModel.findOne({
        _id: enrollmentId,
        user: userId,
        isDeleted: false,
        enrollmentStatus: 'approved'
    });

    if (!enrollment) {
        throw new UNAUTHORIZED("You must be enrolled and approved to access lecture details");
    }

    // Only allow Recorded Lectures enrollment type
    if (enrollment.enrollmentType !== 'Recorded Lectures') {
        throw new UNAUTHORIZED("Lectures are only available for Recorded Lectures enrollments");
    }

    // Verify module belongs to this course
    const module = await courseModuleModel.findOne({
        _id: moduleId,
        moduleCourse: enrollment.course,
        isDeleted: false
    }).select('_id').lean();

    if (!module) {
        throw new NOT_FOUND("Module not found");
    }

    // Get lecture with secure URL
    const lecture = await courseLectureModel.findOne({
        _id: lectureId,
        lectureCourse: enrollment.course,
        isDeleted: false
    }).lean();

    if (!lecture) {
        throw new NOT_FOUND("Lecture not found");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Lecture details retrieved",
        data: {
            _id: lecture._id,
            title: lecture.title,
            duration: lecture.duration,
            resolution: lecture.resolution,
            fileSize: lecture.fileSize,
            lectureInfo: lecture.lectureInfo
        }
    });
});

// Get PDF material details with secure URL (only for Recorded enrollments)
const getPdfDetail = asyncWrapper(async (req, res) => {
    const { enrollmentId, moduleId, pdfId } = req.params;
    const userId = req.user.userId;

    // Verify enrollment and approval
    const enrollment = await enrollmentModel.findOne({
        _id: enrollmentId,
        user: userId,
        isDeleted: false,
        enrollmentStatus: 'approved'
    });

    if (!enrollment) {
        throw new UNAUTHORIZED("You must be enrolled and approved to access PDF details");
    }

    // Only allow Recorded Lectures enrollment type
    if (enrollment.enrollmentType !== 'Recorded Lectures') {
        throw new UNAUTHORIZED("PDF materials are only available for Recorded Lectures enrollments");
    }

    // Verify module belongs to this course
    const module = await courseModuleModel.findOne({
        _id: moduleId,
        moduleCourse: enrollment.course,
        isDeleted: false
    }).select('_id').lean();

    if (!module) {
        throw new NOT_FOUND("Module not found");
    }

    // Get PDF material with secure URL
    const pdf = await pdfMaterialModel.findOne({
        _id: pdfId,
        pdfCourse: enrollment.course,
        isDeleted: false
    }).lean();

    if (!pdf) {
        throw new NOT_FOUND("PDF material not found");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "PDF details retrieved",
        data: {
            _id: pdf._id,
            title: pdf.title,
            pdfMaterialInfo: pdf.pdfMaterialInfo
        }
    });
});

export {
    createEnrollment,
    getUserEnrollments,
    getSingleEnrollment,
    checkEnrollmentStatus,
    getAllEnrollments,
    getPendingEnrollments,
    updateEnrollmentStatus,
    getEnrolledCourseData,
    getModuleDetails,
    getLectureDetail,
    getPdfDetail
};
