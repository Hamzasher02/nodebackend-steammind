import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import enrollmentModel from "../model/enrollment.model.js";
import CourseModuleModel from "../model/coursemodule.model.js";
import StudentModuleProgressModel from "../model/studentmoduleprogress.model.js";
import studentModel from "../model/student.model.js";
import { UNAUTHORIZED } from "../error/error.js";
import courseModel from "../model/course.model.js";
import courseModuleModel from "../model/coursemodule.model.js";
const getAllEnrolledStudentsProgress = asyncWrapper(async (req, res) => {

    // 1️⃣ Get all approved live-class enrollments
    const enrollments = await enrollmentModel.find({
        enrollmentStatus: "approved",
        enrollmentType: "Live Classes",
        isDeleted: false
    })
        .populate("user", "firstName lastName email profilePicture")
        .populate("course", "courseTitle")
        .sort({ createdAt: -1 });

    if (!enrollments.length) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No enrolled students found",
            data: []
        });
    }

    // 2️⃣ Get all student profiles in one query
    const studentIds = enrollments.map(e => e.user._id);
    const studentProfiles = await studentModel.find({
        createdBy: { $in: studentIds }
    }).select("createdBy level");

    const studentProfileMap = {};
    studentProfiles.forEach(profile => {
        studentProfileMap[profile.createdBy.toString()] = profile.level || "Basic";
    });

    // 3️⃣ Calculate progress for each enrollment
    const data = await Promise.all(
        enrollments.map(async (enrollment) => {

            // Total modules for the course
            const totalModules = await CourseModuleModel.countDocuments({
                moduleCourse: enrollment.course._id,
                isDeleted: false
            });

            // Completed modules for this student
            const completedModules = await StudentModuleProgressModel.countDocuments({
                enrollment: enrollment._id,
                student: enrollment.user._id,
                isCompleted: true,
                isDeleted: false
            });

            const progressPercentage = totalModules > 0
                ? Math.round((completedModules / totalModules) * 100)
                : 0;

            return {
                studentId: enrollment.user._id,
                studentName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
                email: enrollment.user.email,
                courseId: enrollment.course._id,
                courseTitle: enrollment.course.courseTitle,
                subscription: studentProfileMap[enrollment.user._id.toString()] || "Basic",
                enrollmentDate: enrollment.createdAt,
                progressPercentage,
                enrollmentId: enrollment._id
            };
        })
    );

    // 4️⃣ Send response
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Enrolled students progress fetched successfully",
        data
    });
});
const getStudentProgress = asyncWrapper(async (req, res) => {
    const { studentId } = req.params;

    // 1️⃣ Get all approved live-class enrollments for the student
    const enrollments = await enrollmentModel.find({
        user: studentId,
        enrollmentStatus: "approved",
        enrollmentType: "Live Classes",
        isDeleted: false
    }).populate("course", "courseTitle");

    if (!enrollments || enrollments.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No live class enrollments found for this student",
            data: []
        });
    }

    // 2️⃣ Calculate progress for each enrolled course
    const progressReport = await Promise.all(
        enrollments.map(async (enrollment) => {
            const courseId = enrollment.course._id;

            // Total modules for the course
            const totalModules = await CourseModuleModel.countDocuments({
                moduleCourse: courseId,
                isDeleted: false
            });

            // Completed modules for this student
            const completedModules = await StudentModuleProgressModel.countDocuments({
                enrollment: enrollment._id,
                student: studentId,
                isCompleted: true,
                isDeleted: false
            });

            const progressPercentage = totalModules > 0
                ? Math.round((completedModules / totalModules) * 100)
                : 0;

            return {
                courseId: courseId,
                courseTitle: enrollment.course.courseTitle,
                enrollmentId: enrollment._id,
                enrollmentType: enrollment.enrollmentType,
                stats: {
                    totalModules,
                    completedModules,
                    remainingModules: Math.max(0, totalModules - completedModules),
                    progressPercentage
                }
            };
        })
    );

    // 3️⃣ Send response
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Student progress calculated successfully",
        data: progressReport
    });
});

const getStudentCourseModules = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.userId;

    // 1️⃣ Find the course
    const course = await courseModel.findById(courseId);
    if (!course || course.isDeleted) throw new NOT_FOUND("Course not found");

    // 2️⃣ Find the student's enrollment for this course
    const enrollment = await enrollmentModel.findOne({
        course: courseId,
        user: studentId,
        isDeleted: false
    });
    if (!enrollment) throw new NOT_FOUND("Enrollment not found for this course");

    // 3️⃣ Get all modules for this course
    const modules = await courseModuleModel
        .find({ moduleCourse: courseId, isDeleted: false })
        .sort({ moduleIndex: 1 });

    if (!modules.length) throw new NOT_FOUND("No modules found for this course");

    // 4️⃣ Get student's progress for these modules
    const moduleIds = modules.map(m => m._id);
    const progressRecords = await StudentModuleProgressModel.find({
        student: studentId,
        enrollment: enrollment._id,
        module: { $in: moduleIds },
        isDeleted: false
    });

    const progressMap = {};
    progressRecords.forEach(record => {
        progressMap[record.module.toString()] = record.isCompleted;
    });

    // 5️⃣ Prepare response
    const moduleProgress = modules.map(m => ({
        moduleId: m._id,
        moduleName: m.moduleName,
        isCompleted: progressMap[m._id.toString()] || false
    }));

    res.status(200).json({
        success: true,
        course: { id: course._id, title: course.courseTitle },
        data: moduleProgress
    });
});
const getInstructorStudentModules = asyncWrapper(async (req, res) => {
    const { courseId, studentId } = req.params;
    const instructorId = req.user.userId;

    // 1️⃣ Validate course
    const course = await courseModel.findById(courseId);
    if (!course || course.isDeleted) throw new NOT_FOUND("Course not found");

    // 2️⃣ Validate enrollment
    const enrollment = await enrollmentModel.findOne({
        course: courseId,
        user: studentId,
        isDeleted: false
    });
    if (!enrollment) throw new NOT_FOUND("Enrollment not found for this student");

    // 3️⃣ Fetch all modules for this course
    const modules = await courseModuleModel.find({
        moduleCourse: courseId,
        isDeleted: false
    }).sort({ moduleIndex: 1 });

    if (!modules.length) throw new NOT_FOUND("No modules found for this course");

    // 4️⃣ Fetch module progress for this student & enrollment
    const moduleIds = modules.map(m => m._id);
    const progressRecords = await StudentModuleProgressModel.find({
        student: studentId,
        enrollment: enrollment._id,
        module: { $in: moduleIds },
        isDeleted: false
    }).populate({ path: 'completedBy', select: 'firstName lastName role' });

    // Map moduleId → progress record
    const progressMap = {};
    progressRecords.forEach(record => {
        progressMap[record.module.toString()] = {
            isCompleted: record.isCompleted,
            completedAt: record.completedAt,
            completedBy: record.completedBy ? {
                id: record.completedBy._id,
                name: `${record.completedBy.firstName} ${record.completedBy.lastName}`
            } : null
        };
    });

    // 5️⃣ Prepare response
    const moduleProgress = modules.map(m => ({
        moduleId: m._id,
        moduleName: m.moduleName,
        isCompleted: progressMap[m._id.toString()]?.isCompleted || false,
        completedAt: progressMap[m._id.toString()]?.completedAt || null,
        completedBy: progressMap[m._id.toString()]?.completedBy || null
    }));

    res.status(200).json({
        success: true,
        course: { id: course._id, title: course.courseTitle },
        student: { id: studentId },
        data: moduleProgress
    });
});

export { getStudentProgress, getAllEnrolledStudentsProgress,getStudentCourseModules,getInstructorStudentModules };
