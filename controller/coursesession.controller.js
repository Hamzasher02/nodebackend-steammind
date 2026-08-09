import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import courseSessionModel from "../model/coursesession.model.js";
import enrollmentModel from "../model/enrollment.model.js";
import courseModel from "../model/course.model.js";
import courseModuleModel from "../model/coursemodule.model.js";
import studentModuleProgressModel from "../model/studentmoduleprogress.model.js";
import userModel from "../model/user.model.js";
import instructorModel from "../model/instructor.model.js";
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from "../error/error.js";
import mongoose from "mongoose";
/**
 * Create a new course session (Admin only)
 * Creates session for a specific student in a specific course with a specific instructor
 * Sends notifications to instructor and student
 */
const createCourseSession = asyncWrapper(async (req, res) => {
    const {
        enrollmentId,
        instructorId,
        sessionDate,
        startTime,
        endTime,
        sessionLink,
        notes
    } = req.body;
    
    const enrollment = await enrollmentModel.findById(enrollmentId);
    if (!enrollment) throw new NOT_FOUND("Enrollment not found");

    if (enrollment.enrollmentStatus !== 'approved') {
        throw new BAD_REQUEST("Enrollment must be approved to create sessions");
    }
    const instructorProfile = await instructorModel.findOne({ createdBy: instructorId });

    if (!instructorProfile) {
        throw new NOT_FOUND("Instructor profile not found for this user");
    }
    const isQualified = instructorProfile.coursePreferences.some(
        (prefId) => prefId.toString() === enrollment.course.toString()
    );

    if (!isQualified) {
        throw new BAD_REQUEST("This instructor is not qualified/assigned to teach this specific course");
    }

    const courseSession = await courseSessionModel.create({
        enrollment: enrollmentId,
        course: enrollment.course,
        student: enrollment.user,
        instructor: instructorId,
        sessionDate,
        startTime,
        endTime,
        sessionLink: sessionLink || null,
        notes: notes || null,
        createdBy: req.user.userId,
        
    });
    enrollment.isSessionAssigned=true
    await enrollment.save()
    // 4. Populate for response
    const populatedSession = await courseSessionModel.findById(courseSession._id)
        .populate('course', 'courseTitle')
        .populate('instructor', 'firstName lastName email')
        .populate('student', 'firstName lastName email');

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Course session created and instructor validated successfully",
        data: populatedSession
    });
});

/**
 * Get all course sessions created by admin (with pagination)
 */
const getAllCourseSessions = asyncWrapper(async (req, res) => {
    // const enrollment=await enrollmentModel.find({})

    const { page = 1, limit = 10, courseId, enrollmentId, sessionStatus } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isDeleted: false };
    if (courseId) filter.course = courseId;
    if (enrollmentId) filter.enrollment = enrollmentId;
    if (sessionStatus) filter.sessionStatus = sessionStatus;

   const sessions = await courseSessionModel.find(filter)
    .populate('course', 'courseTitle courseThumbnail')
    .populate('enrollment')
    .populate('instructor', 'firstName lastName email')
    .populate({
        path: 'student', // the User reference
        select: 'firstName lastName email profilePicture',
        populate: { // populate nested student profile
            path: 'student', // virtual from User -> Student
            select: 'level age parentPhoneNumber'
        }
    })
    .populate('createdBy', 'firstName lastName')
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });


    const total = await courseSessionModel.countDocuments(filter);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course sessions retrieved successfully",
        data: sessions,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Get sessions for a specific course (for admin view)
 */
const getCourseSessionsByCourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sessionStatus } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new BAD_REQUEST("Invalid course id");
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found");

    const filter = { course: courseId, isDeleted: false };
    if (sessionStatus) filter.sessionStatus = sessionStatus;
    const sessions = await courseSessionModel
        .find(filter)
        .select("+sessionStatus +enrollment +instructor +student")
        .populate("enrollment")
        .populate("instructor", "firstName lastName email")
        .populate("student", "firstName lastName email")
        .sort({ sessionDate: 1, startTime: 1 })
        .skip(skip)
        .limit(limitNum);

    const total = await courseSessionModel.countDocuments(filter);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course sessions retrieved successfully",
        data: sessions,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        }
    });
});

/**
 * Get sessions for a specific enrollment
 */
const getSessionsByEnrollment = asyncWrapper(async (req, res) => {
    const { enrollmentId } = req.params;

    // Validate enrollment exists
    const enrollment = await enrollmentModel.findById(enrollmentId);
    if (!enrollment) {
        throw new NOT_FOUND("Enrollment not found");
    }

    const sessions = await courseSessionModel.find({
        enrollment: enrollmentId,
        isDeleted: false
    })
        .populate('course', 'courseTitle')
        .populate('instructor', 'firstName lastName email')
        .populate('student', 'firstName lastName email')
        .sort({ sessionDate: 1, startTime: 1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Sessions retrieved successfully",
        data: sessions
    });
});

/**
 * Get sessions for an instructor (to view their scheduled classes)
 */
const getInstructorSessions = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10, sessionStatus } = req.query;
    const skip = (page - 1) * limit;

    // Instructor can only see their own sessions
    const filter = {
        instructor: req.user.userId,
        isDeleted: false
    };

    if (sessionStatus) filter.sessionStatus = sessionStatus;

    const sessions = await courseSessionModel.find(filter)
        .populate('course', 'courseTitle courseThumbnail') // include course thumbnail
        .populate('enrollment')
        .populate({
            path: 'student', // the User reference
            select: 'firstName lastName email profilePicture',
            populate: { // populate the virtual Student info
                path: 'student', // virtual in User -> Student
                select: 'level age parentPhoneNumber'
            }
        })
        .skip(skip)
        .limit(Number(limit))
        .sort({ sessionDate: 1, startTime: 1 });

    const total = await courseSessionModel.countDocuments(filter);

    // Optional: format student info nicely
    const formattedSessions = sessions.map(s => ({
        ...s.toObject(),
        student: {
            _id: s.student._id,
            firstName: s.student.firstName,
            lastName: s.student.lastName,
            email: s.student.email,
            profilePicture: s.student.profilePicture,
            level: s.student.student?.level || 'basic',
            age: s.student.student?.age || null,
            parentPhoneNumber: s.student.student?.parentPhoneNumber || null
        }
    }));

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Your sessions retrieved successfully",
        data: formattedSessions,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Get sessions for a student (to view their enrolled course sessions)
 * Student can only see sessions where they are the student
 */
const getStudentSessions = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10, courseId, sessionStatus } = req.query;
    const skip = (page - 1) * limit;

    // Student can only see their own sessions
    const filter = {
        student: req.user.userId,
        isDeleted: false
    };

    if (courseId) filter.course = courseId;
    if (sessionStatus) filter.sessionStatus = sessionStatus;

    const sessions = await courseSessionModel.find(filter)
        .populate('course', 'courseTitle')
        .populate('enrollment')
        .populate('instructor', 'firstName lastName email')
        .skip(skip)
        .limit(Number(limit))
        .sort({ sessionDate: 1, startTime: 1 });

    const total = await courseSessionModel.countDocuments(filter);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Your enrolled sessions retrieved successfully",
        data: sessions,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Get a single course session by ID
 * Admin can view any session
 * Instructor can only view their own sessions
 * Student can only view their own sessions
 */
const getSingleSession = asyncWrapper(async (req, res) => {
    const { sessionId } = req.params;

    const session = await courseSessionModel.findOne({
        _id: sessionId,
        isDeleted: false
    })
        .populate('course', 'courseTitle courseCategory')
        .populate('enrollment')
        .populate('instructor', 'firstName lastName email')
        .populate('student', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName');

    if (!session) {
        throw new NOT_FOUND("Course session not found");
    }

    // Authorization check: Admin can view all, Instructor/Student can only view their own
    if (req.user.role !== 'admin') {
        if (req.user.role === 'instructor' && session.instructor._id.toString() !== req.user.userId) {
            throw new UNAUTHORIZED("You are not authorized to view this session");
        }
        if (req.user.role === 'student' && session.student._id.toString() !== req.user.userId) {
            throw new UNAUTHORIZED("You are not authorized to view this session");
        }
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course session retrieved successfully",
        data: session
    });
});

/**
 * Update course session (Admin only)
 */
const updateCourseSession = asyncWrapper(async (req, res) => {
    const { sessionId } = req.params;
    const { sessionDate, startTime, endTime, sessionLink, notes, sessionStatus } = req.body;

    const session = await courseSessionModel.findOne({
        _id: sessionId,
        isDeleted: false
    });

    if (!session) {
        throw new NOT_FOUND("Course session not found");
    }

    // Update allowed fields
    if (sessionDate) session.sessionDate = sessionDate;
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (sessionLink) session.sessionLink = sessionLink;
    if (notes) session.notes = notes;
    if (sessionStatus) {
        if (!['scheduled', 'ongoing', 'completed', 'cancelled'].includes(sessionStatus)) {
            throw new BAD_REQUEST("Invalid session status");
        }
        session.sessionStatus = sessionStatus;
    }

    await session.save();

    const updatedSession = await courseSessionModel.findById(sessionId)
        .populate('course', 'courseTitle')
        .populate('enrollment')
        .populate('instructor', 'firstName lastName email')
        .populate('student', 'firstName lastName email');

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course session updated successfully",
        data: updatedSession
    });
});

/**
 * Delete course session (soft delete)
 */
const deleteCourseSession = asyncWrapper(async (req, res) => {
    const { sessionId } = req.params;

    const session = await courseSessionModel.findOne({
        _id: sessionId,
        isDeleted: false
    });

    if (!session) {
        throw new NOT_FOUND("Course session not found");
    }

    session.isDeleted = true;
    session.deletedAt = new Date();
    session.deletedBy = req.user.userId;

    await session.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course session deleted successfully"
    });
});

/**
 * Get sessions count for a course
 */
const getSessionsCountByCourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    const course = await courseModel.findById(courseId);
    if (!course) {
        throw new NOT_FOUND("Course not found");
    }

    const totalSessions = await courseSessionModel.countDocuments({
        course: courseId,
        isDeleted: false
    });

    const completedSessions = await courseSessionModel.countDocuments({
        course: courseId,
        sessionStatus: 'completed',
        isDeleted: false
    });

    const scheduledSessions = await courseSessionModel.countDocuments({
        course: courseId,
        sessionStatus: 'scheduled',
        isDeleted: false
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Session counts retrieved successfully",
        data: {
            totalSessions,
            completedSessions,
            scheduledSessions,
            upcomingSessions: scheduledSessions
        }
    });
});

/**
 * Get student's sessions for a specific course
 */
const getStudentSessionsByEnrollment = asyncWrapper(async (req, res) => {
    const { enrollmentId } = req.params;

    // Verify enrollment belongs to current student
    const enrollment = await enrollmentModel.findOne({
        _id: enrollmentId,
        user: req.user.userId
    });

    if (!enrollment) {
        throw new UNAUTHORIZED("You are not authorized to view this enrollment's sessions");
    }

    const sessions = await courseSessionModel.find({
        enrollment: enrollmentId,
        isDeleted: false
    })
        .populate('course', 'courseTitle')
        .populate('instructor', 'firstName lastName email')
        .sort({ sessionDate: 1, startTime: 1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Sessions retrieved successfully",
        data: sessions
    });
});

// Instructor: Mark module as complete for a specific student
// const markModuleComplete = asyncWrapper(async (req, res) => {
//     const { sessionId, moduleId } = req.params;
//     const { notes } = req.body || {};
//     const instructorId = req.user.userId;

//     // Verify instructor owns/leads this session
//     const session = await courseSessionModel.findOne({
//         _id: sessionId,
//         instructor: instructorId,
//         isDeleted: false
//     });

//     if (!session) {
//         throw new UNAUTHORIZED("You can only mark modules for sessions you are assigned to");
//     }

//     // Verify module exists and belongs to this course
//     const module = await courseModuleModel.findOne({
//         _id: moduleId,
//         moduleCourse: session.course,
//         isDeleted: false
//     });

//     if (!module) {
//         throw new NOT_FOUND("Module not found in this course");
//     }

//     // Create or update student module progress
//     const progress = await studentModuleProgressModel.findOneAndUpdate(
//         {
//             enrollment: session.enrollment,
//             student: session.student,
//             module: moduleId,
//             course: session.course
//         },
//         {
//             isCompleted: true,
//             completedAt: new Date(),
//             completedBy: instructorId,
//             notes: notes || null
//         },
//         { upsert: true, new: true, runValidators: true }
//     );

//     res.status(StatusCodes.OK).json({
//         success: true,
//         message: "Module marked as complete",
//         data: progress
//     });
// });
// Instructor: Mark module as complete for a specific student
const markModuleComplete = asyncWrapper(async (req, res) => {
    const { sessionId, moduleId } = req.params;

    // ✅ FIX: req.body can be undefined if client sends no body
    const body = req.body ?? {};
    const notes = body.notes ?? null;

    const instructorId = req.user.userId;

    // Verify instructor owns/leads this session
    const session = await courseSessionModel.findOne({
        _id: sessionId,
        instructor: instructorId,
        isDeleted: false
    });

    if (!session) {
        throw new UNAUTHORIZED("You can only mark modules for sessions you are assigned to");
    }

    // Verify module exists and belongs to this course
    const module = await courseModuleModel.findOne({
        _id: moduleId,
        moduleCourse: session.course,
        isDeleted: false
    });

    if (!module) {
        throw new NOT_FOUND("Module not found in this course");
    }

    // Create or update student module progress
    const progress = await studentModuleProgressModel.findOneAndUpdate(
        {
            enrollment: session.enrollment,
            student: session.student,
            module: moduleId,
            course: session.course
        },
        {
            isCompleted: true,
            completedAt: new Date(),
            completedBy: instructorId,
            notes: notes // ✅ will be null if no body sent
        },
        { upsert: true, new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Module marked as complete",
        data: progress
    });
});


// Instructor: Get session detail with modules for that enrollment
const getSessionDetailWithModules = asyncWrapper(async (req, res) => {
    const { sessionId } = req.params;
    const instructorId = req.user.userId;

    // Verify instructor owns this session
    const session = await courseSessionModel.findOne({
        _id: sessionId,
        instructor: instructorId,
        isDeleted: false
    })
        .populate('student', 'firstName lastName email profilePicture')
        .populate('course', 'courseTitle')
        .lean();

    if (!session) {
        throw new UNAUTHORIZED("You can only view sessions assigned to you");
    }

    // Get all modules for this course
    const modules = await courseModuleModel.find({
        moduleCourse: session.course,
        isDeleted: false
    })
        .select('_id moduleName moduleDescription moduleIndex noOfSession sessionDuration')
        .sort({ moduleIndex: 1 })
        .lean();

    // Get completion status for each module for this student
    const moduleIds = modules.map(m => m._id);
    const progressRecords = await studentModuleProgressModel.find({
        enrollment: session.enrollment,
        student: session.student,
        module: { $in: moduleIds },
        isDeleted: false
    })
        .select('module isCompleted completedAt notes')
        .lean();

    // Create a map for quick lookup
    const progressMap = {};
    progressRecords.forEach(p => {
        progressMap[p.module.toString()] = p;
    });

    // Attach progress to modules
    const modulesWithProgress = modules.map(m => ({
        ...m,
        isCompleted: progressMap[m._id.toString()]?.isCompleted || false,
        completedAt: progressMap[m._id.toString()]?.completedAt || null,
        notes: progressMap[m._id.toString()]?.notes || null
    }));

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Session details with modules retrieved",
        data: {
            session,
            modules: modulesWithProgress
        }
    });
});
//by hamza hanid latest... 1 9 26 8:16 .
const getInstructorStudentsByCourse = asyncWrapper(async (req, res) => {
    const instructorId = req.user.userId;
    const { courseId } = req.params;
    const sessions = await courseSessionModel.find({
        instructor: instructorId,
        course: courseId,
        isDeleted: false
    })
        .populate('student', 'firstName lastName email profilePicture')
        .lean();

    if (!sessions || sessions.length === 0) {
        throw new NOT_FOUND("No students found for this course");
    }

    const studentMap = {};
    sessions.forEach(session => {
        const student = session.student;
        if (student && !studentMap[student._id.toString()]) {
            studentMap[student._id.toString()] = student;
        }
    });
    const students = Object.values(studentMap);

    const totalModules = await courseModuleModel.countDocuments({
        moduleCourse: courseId,
        isDeleted: false
    });

    const studentsWithProgress = await Promise.all(students.map(async (student) => {
        const modulesMarkedComplete = await studentModuleProgressModel.countDocuments({
            student: student._id,
            course: courseId,
            completedBy: instructorId,
            isCompleted: true,
            isDeleted: false
        });

        return {
            ...student,
            totalModules,
            modulesMarkedComplete
        };
    }));

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Students and their module progress retrieved successfully",
        data: studentsWithProgress
    });
});
export {
    createCourseSession,
    getAllCourseSessions,
    getCourseSessionsByCourse,
    getSessionsByEnrollment,
    getInstructorSessions,
    getStudentSessions,
    getSingleSession,
    updateCourseSession,
    deleteCourseSession,
    getSessionsCountByCourse,
    getStudentSessionsByEnrollment,
    markModuleComplete,
    getSessionDetailWithModules,
    getInstructorStudentsByCourse
};
