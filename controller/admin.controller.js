import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { uploadToCloud } from "../services/cloudinary.uploader.services.js";
import { BAD_REQUEST, UNAUTHORIZED, NOT_FOUND } from "../error/error.js";
import staffModel from "../model/staff.model.js";
import courseModel from "../model/course.model.js";
import userModel from "../model/user.model.js";
import { getInstructorAvailability, getAllInstructorsAvailability } from "./instructor.controller.js";
import { changeAdminPassword } from "./user.controller.js";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";

//we will remove these later no need to keep like keep controller and remove the route
const createAdmin = asyncWrapper(async (req, res) => {
    const { email, password } = req.body
    const user = await staffModel.create({
        firstName: "Hamza",
        lastName: "Hanif",
        email,
        profilePicture: {
            secureUrl: "https://res.cloudinary.com/demo/image/upload/v1690000000/sample_admin.jpg",
            publicId: "admin_images/sample_admin"
        },
        password,
        role: 'admin',
        roleStatus: 'active'
    })

    res.status(StatusCodes.OK).json({
        sucess: true,
        message: "user created successfully",
        data: user
    })

})




/**
 * ===============================================
 * ADMIN CONTROLLER - HAMZA SHER
 * ===============================================
 * Note: changeAdminPassword is imported from user.controller.js (moved on October 28, 2025)
 * All password change functions are now centralized in user controller
 * ===============================================
 */

/**
 * ===============================================
 * ASSIGN COURSE TO INSTRUCTOR - HAMZA SHER
 * ===============================================
 * Updated by: Hamza Hanif
 * Date: November 7, 2025
 * Changes Added:
 * - Supports new structure: { instructor, assignedBy, assignedAt }
 * - Prevents duplicate assignment based on instructor field
 * - Automatically saves assignedBy from logged-in admin
 * - Comments added on modified lines
 * ===============================================
 */

const assignCourseToInstructor = asyncWrapper(async (req, res) => {
    const { courseId, instructorIds } = req.body;
    const adminId = req.user._id;  // new who is assigning

    if (!courseId) throw new BAD_REQUEST("Course ID is required");
    if (!instructorIds || !Array.isArray(instructorIds) || instructorIds.length === 0) {
        throw new BAD_REQUEST("Instructor IDs array is required and must not be empty");
    }

    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found with the provided ID");

    const instructors = await userModel.find({
        _id: { $in: instructorIds },
        role: "instructor"
    });

    if (instructors.length !== instructorIds.length) {
        throw new BAD_REQUEST("One or more instructor IDs are invalid or not instructors");
    }

    // new extract existing instructor IDs from objects
    const existingInstructorIds = course.assignedInstructors.map(a => a.instructor.toString());

    //new filter new instructors
    const filteredNewIds = instructorIds.filter(id => !existingInstructorIds.includes(id.toString()));

    if (filteredNewIds.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "All instructors are already assigned to this course",
            data: course
        });
    }

    // new push objects instead of just ids
    filteredNewIds.forEach(id => {
        course.assignedInstructors.push({
            instructor: id,
            assignedBy: adminId,        // new
            assignedAt: new Date()      //  new
        });
    });

    await course.save();

    const updatedCourse = await courseModel
        .findById(courseId)
        .populate("assignedInstructors.instructor", "firstName lastName email")
        .populate("assignedInstructors.assignedBy", "firstName lastName email")
        .populate("createdBy", "firstName lastName email");

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course assigned to instructors successfully",
        data: updatedCourse
    });
});

/**
 * ===============================================
 * REMOVE INSTRUCTOR FROM COURSE - HAMZA SHER
 * ===============================================
 * Updated by: Hamza Hanif
 * Date: November 7, 2025
 * Changes Added:
 * - Supports removing based on nested instructor field
 * - Works with new object structure
 * - Comments added for clarity
 * ===============================================
 */

const removeInstructorFromCourse = asyncWrapper(async (req, res) => {
    const { courseId, instructorId } = req.body;

    if (!courseId) throw new BAD_REQUEST("Course ID is required");
    if (!instructorId) throw new BAD_REQUEST("Instructor ID is required");

    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found with the provided ID");

    // new check inside nested structure
    const isAssigned = course.assignedInstructors.some(a => 
        a.instructor.toString() === instructorId.toString()
    );

    if (!isAssigned) {
        throw new BAD_REQUEST("Instructor is not assigned to this course");
    }

    // new remove based on nested object
    course.assignedInstructors = course.assignedInstructors.filter(
        a => a.instructor.toString() !== instructorId.toString()
    );

    await course.save();

    const updatedCourse = await courseModel
        .findById(courseId)
        .populate("assignedInstructors.instructor", "firstName lastName email")
        .populate("assignedInstructors.assignedBy", "firstName lastName email")
        .populate("createdBy", "firstName lastName email");

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Instructor removed from course successfully",
        data: updatedCourse
    });
});

/**
 * ===============================================
 * ADMIN CONTROLLER - HAMZA SHER
 * ===============================================
 * Note: getInstructorAvailability and getAllInstructorsAvailability 
 * are imported from instructor.controller.js (moved on October 28, 2025)
 * All instructor-related availability logic is now centralized in instructor controller
 * ===============================================
 */

export { createAdmin, changeAdminPassword, assignCourseToInstructor, getInstructorAvailability, getAllInstructorsAvailability }