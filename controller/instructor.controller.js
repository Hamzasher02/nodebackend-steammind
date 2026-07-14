/**
 * ===============================================
 * INSTRUCTOR CONTROLLER - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: 2025
 * Purpose: Handle instructor profile management operations
 * Features: Update personal info, academic details, profile picture upload
 * ===============================================
 */
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } from "../error/error.js";
import userModel from "../model/user.model.js";
import instructorModel from "../model/instructor.model.js";
import residenceInformationModel from "../model/residenceinfo.model.js";
import emergencyInformationModel from "../model/emergencycontact.model.js";
import courseModel from "../model/course.model.js";
import availabilityModel from "../model/availability.model.js";
import { uploadToCloud, deleteFromCloud } from "../services/cloudinary.uploader.services.js";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";

/**
 * Update instructor's comprehensive information (personal, residence, emergency)
 * Created by: Hamza Sher
 * Handles personal info, residence info, and emergency contact details
 */
const updateInstructorInformation = asyncWrapper(async (req, res) => {
    let publicid;
    let profilePictureToBeDeleted = null;

    const {
        firstName,
        lastName,
        fatherName,
        phoneNumber,
        email,
        dateOfBirth,
        bio,
        address,
        city,
        country,
        postalCode,
        emergencyFullName,
        emergencyRelationship,
        emergencyPhoneNo,
        coursePreferences
    } = req.body;

    // ================= Personal Info =================
    let personalInfoToUpdate = {};
    if (firstName) personalInfoToUpdate.firstName = firstName;
    if (lastName) personalInfoToUpdate.lastName = lastName;
    if (fatherName) personalInfoToUpdate.fatherName = fatherName;
    if (phoneNumber) personalInfoToUpdate.phoneNumber = phoneNumber;
    if (email) personalInfoToUpdate.email = email;
    if (dateOfBirth) personalInfoToUpdate.dateOfBirth = dateOfBirth;
    if (bio) personalInfoToUpdate.bio = bio;

    // ================= Residence Info =================
    let residenceInfoToUpdate = {};
    if (address) residenceInfoToUpdate.address = address;
    if (city) residenceInfoToUpdate.city = city;
    if (country) residenceInfoToUpdate.country = country;
    if (postalCode) residenceInfoToUpdate.postalCode = postalCode;

    // ================= Emergency Info =================
    let emergencyInfoToUpdate = {};
    if (emergencyFullName) emergencyInfoToUpdate.fullName = emergencyFullName;
    if (emergencyRelationship) emergencyInfoToUpdate.relationship = emergencyRelationship;
    if (emergencyPhoneNo) emergencyInfoToUpdate.phoneNumber = emergencyPhoneNo;

    // ================= Instructor Info =================
    let instructorInfoToUpdate = {};

    const user = await userModel.findById(req.user.userId);
    if (!user) throw new NOT_FOUND("No user exists with this id");

    // ================= Profile Picture =================
    if (req.file) {
        if (!req.file.mimetype.startsWith("image/")) {
            throw new BAD_REQUEST("Please provide valid image format.");
        }

        try {
            const profilePictureCloud = await uploadToCloud(req.file.path);
            publicid = profilePictureCloud.publicId;

            personalInfoToUpdate.profilePicture = profilePictureCloud;
            profilePictureToBeDeleted = user.profilePicture?.publicId;
        } catch (err) {
            if (publicid) await deleteFromCloud(publicid);
            throw err;
        }
    }

    // ================= Course Preferences =================
    if (coursePreferences !== undefined) {
        if (!Array.isArray(coursePreferences)) {
            throw new BAD_REQUEST("coursePreferences must be an array");
        }

        // ✅ keep ONLY valid ObjectIds
        const cleanedCoursePrefs = coursePreferences.filter(
            id => mongoose.Types.ObjectId.isValid(id)
        );

        if (cleanedCoursePrefs.length === 0) {
            throw new BAD_REQUEST("coursePreferences must be a non-empty array");
        }

        // ✅ remove duplicates
        const uniqueCoursePrefs = [...new Set(cleanedCoursePrefs)];

        const validCourses = await courseModel
            .find({ _id: { $in: uniqueCoursePrefs } })
            .select("_id");

        if (validCourses.length !== uniqueCoursePrefs.length) {
            throw new BAD_REQUEST("One or more selected courses are invalid");
        }

        instructorInfoToUpdate.coursePreferences = uniqueCoursePrefs;
    }

    // ================= Nothing to Update Check =================
    if (
        !Object.keys(personalInfoToUpdate).length &&
        !Object.keys(residenceInfoToUpdate).length &&
        !Object.keys(emergencyInfoToUpdate).length &&
        !Object.keys(instructorInfoToUpdate).length
    ) {
        throw new BAD_REQUEST("Please provide something to update");
    }

    // ================= DB Updates =================
    let updatedUser = null;
    if (Object.keys(personalInfoToUpdate).length) {
        updatedUser = await userModel.findByIdAndUpdate(
            req.user.userId,
            personalInfoToUpdate,
            { new: true, runValidators: true }
        );
    }

    let updatedResidence = null;
    if (Object.keys(residenceInfoToUpdate).length) {
        residenceInfoToUpdate.createdBy = req.user.userId;
        updatedResidence = await residenceInformationModel.findOneAndUpdate(
            { createdBy: req.user.userId },
            residenceInfoToUpdate,
            { upsert: true, new: true, runValidators: true }
        );
    }

    let updatedEmergency = null;
    if (Object.keys(emergencyInfoToUpdate).length) {
        emergencyInfoToUpdate.createdBy = req.user.userId;
        updatedEmergency = await emergencyInformationModel.findOneAndUpdate(
            { createdBy: req.user.userId },
            emergencyInfoToUpdate,
            { upsert: true, new: true, runValidators: true }
        );
    }

    let updatedInstructor = null;
    if (Object.keys(instructorInfoToUpdate).length) {
        updatedInstructor = await instructorModel.findOneAndUpdate(
            { createdBy: req.user.userId },
            instructorInfoToUpdate,
            { new: true, runValidators: true }
        );
    }

    // ================= Cloud Cleanup =================
    if (profilePictureToBeDeleted) {
        if (req.file?.path) cleanupUploadedFiles(req);
        await deleteFromCloud(profilePictureToBeDeleted);
    }

    // ================= Response =================
    const responseData = {};

    if (updatedUser) {
        Object.assign(responseData, {
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            fatherName: updatedUser.fatherName,
            phoneNumber: updatedUser.phoneNumber,
            email: updatedUser.email,
            dateOfBirth: updatedUser.dateOfBirth,
            bio: updatedUser.bio,
            profilePicture: updatedUser.profilePicture?.secureUrl
        });
    }

    if (updatedResidence) {
        Object.assign(responseData, {
            address: updatedResidence.address,
            city: updatedResidence.city,
            country: updatedResidence.country,
            postalCode: updatedResidence.postalCode
        });
    }

    if (updatedEmergency) {
        Object.assign(responseData, {
            emergencyFullName: updatedEmergency.fullName,
            emergencyRelationship: updatedEmergency.relationship,
            emergencyPhoneNo: updatedEmergency.phoneNumber
        });
    }

    if (updatedInstructor) {
        responseData.coursePreferences = updatedInstructor.coursePreferences;
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Instructor information updated successfully.",
        data: responseData
    });
});

/**
 * Update instructor's academic details
 * Created by: Hamza Sher
 * Following the same pattern as student updates
 */
//updated by hamza hanif 11 27 25
const updateInstructorAcademicDetails = asyncWrapper(async (req, res) => {
    let publicid;
    let transcriptToBeDeleted = null;
    let informationToBeUpdated = {}
    const { qualification, degreeTitle, graduationYear, totalMarks, obtainedMarks, institution } = req.body
    if (qualification) informationToBeUpdated.qualification = qualification;
    if (degreeTitle) informationToBeUpdated.degreeTitle = degreeTitle;
    if (graduationYear) informationToBeUpdated.graduationYear = graduationYear;
    if (totalMarks) informationToBeUpdated.totalMarks = totalMarks;
    if (obtainedMarks) informationToBeUpdated.obtainedMarks = obtainedMarks;
    if (institution) informationToBeUpdated.institution = institution;
    const instructor = await instructorModel.findOne({ createdBy: req.user.userId })
    if (!instructor) throw new NOT_FOUND("no instructor exist with this id")
    if (req.file) {
        // Accept any file type for transcript
        try {
            const transcriptCloud = await uploadToCloud(req.file.path)
            publicid = transcriptCloud.publicId
            if (!transcriptCloud.publicId || !transcriptCloud.secureUrl) {
                throw new INTERNAL_SERVER_ERROR("Unable to upload file to the server please provide a valid file")
            }
            informationToBeUpdated.transcript = { ...transcriptCloud }
            transcriptToBeDeleted = instructor.transcript?.publicId
        } catch (err) {
            await deleteFromCloud(publicid)
            throw err
        }
    }
    if (Object.keys(informationToBeUpdated).length <= 0) throw new BAD_REQUEST("Please provide something to update")
    const updatedInstructorInformation = await instructorModel.findOneAndUpdate({ createdBy: req.user.userId }, informationToBeUpdated, { runValidators: true, new: true })
    if (transcriptToBeDeleted) {
        if (req.file && req.file.path) {
            cleanupUploadedFiles(req)
        }
        await deleteFromCloud(transcriptToBeDeleted)
    };
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Instructor academic details update successfully.',
        data: {
            qualification: updatedInstructorInformation?.qualification,
            degreeTitle: updatedInstructorInformation?.degreeTitle,
            graduationYear: updatedInstructorInformation?.graduationYear,
            totalMarks: updatedInstructorInformation?.totalMarks,
            obtainedMarks: updatedInstructorInformation?.obtainedMarks,
            institution: updatedInstructorInformation?.institution,
            transcript: updatedInstructorInformation?.transcript.secureUrl
        }
    })
})

/**
 * Get instructor's complete profile information
 * Created by: Hamza Sher
 * Following the same pattern as getSingleStudent
 */
const getInstructorProfile = asyncWrapper(async (req, res) => {
    const userId = req.user.userId;
    const user = await userModel
        .findOne({ _id: userId })
        .select("_id firstName fatherName lastName email profilePicture bio phoneNumber role dateOfBirth createdBy");

    if (!user) throw new NOT_FOUND("User not found");

    const instructor = await instructorModel.findOne({ createdBy: userId });
    const emergencyInfo = await emergencyInformationModel.findOne({ createdBy: userId });
    const residenceInfo = await residenceInformationModel.findOne({ createdBy: userId });

    const response = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        fatherName:user.fatherName,
        dateOfBirth: user.dateOfBirth,
        profilePicture: user.profilePicture?.secureUrl,
        bio: user.bio,
        phoneNumber: user.phoneNumber,
        role: user.role,
        academicInfo: {
            qualification: instructor.qualification,
            degreeTitle: instructor.degreeTitle,
            graduationYear: instructor.graduationYear,
            totalMarks: instructor.totalMarks,
            obtainedMarks: instructor.obtainedMarks,
            institution: instructor.institution,
            transcript: instructor.transcript?.secureUrl,
            transcriptVerification: instructor.transcriptVerification,
            newTranscriptRequest: instructor.newTranscriptRequest,
            coursePreferences: instructor.coursePreferences,
        },
        emergencyInfo: {
            fullName: emergencyInfo.fullName,
            relationship: emergencyInfo.relationship,
            phoneNumber: emergencyInfo.phoneNumber,
        },
        residenceInfo: {
            address: residenceInfo.address,
            city: residenceInfo.city,
            country: residenceInfo.country,
            postalCode: residenceInfo.postalCode,
            timezone: residenceInfo.timezone,
        }

    };

    res.status(StatusCodes.OK).json({
        success: true,
        message: "complere instructor profile",
        data: [response]
    });
});


/**
 * Change instructor password
 * Created by: Hamza Sher
 * Handles password change with current password verification
 */
const changeInstructorPassword = asyncWrapper(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Find user with password field included
    const user = await userModel.findOne({ _id: req.user.userId }).select("+password");
    if (!user) throw new NOT_FOUND("No user exists with this id");

    // Verify current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
        throw new BAD_REQUEST("Current password is incorrect");
    }

    // Check if new password is different from current password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
        throw new BAD_REQUEST("New password must be different from current password");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Password changed successfully.',
        data: {}
    });
});

/**
 * ===============================================
 * GET ALL ASSIGNED COURSES FOR INSTRUCTOR - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 12:30 PM
 * Purpose: Retrieve courses assigned to the authenticated instructor
 * Lines Modified: 304-350 (UPDATED FUNCTION)
 * Features: Search, filtering, pagination support
 * Note: Instructor can only see courses assigned to them
 * ===============================================
 */
const getMyAssignedCourses = asyncWrapper(async (req, res) => {
    // Extract query parameters for filtering and searching
    const { search, status, page = 1, limit = 10 } = req.query;

    // Build search object - only courses assigned to this instructor
    let searchObject = {
        'assignedInstructors.instructor': req.user.userId  // Filter courses where this instructor is assigned
    };

    // Add search functionality for course title
    if (search) {
        searchObject.courseTitle = {
            $regex: search,
            $options: 'i'  // Case-insensitive search
        };
    }

    // Add status filtering (published/unpublished)
    if (status) {
        if (status === 'published') {
            searchObject.isCoursePublished = true;
        } else if (status === 'unpublished') {
            searchObject.isCoursePublished = false;
        }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute database query with pagination - get assigned courses only
    const courses = await courseModel
        .find(searchObject)
        .select("courseTitle courseCategory courseSubCategory courseAgeGroup courseLevel courseAccess coursePrice courseThumbnail courseOutline isCoursePublished courseVisibility createdBy assignedInstructors createdAt updatedAt")
        .populate('createdBy', 'firstName lastName email')  // Populate creator info
        .sort({ createdAt: -1 })  // Sort by newest first
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination info
    const totalCourses = await courseModel.countDocuments(searchObject);

    // Check if no courses found
    if (!courses || courses.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No courses assigned to this instructor",
            data: [],
            pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalCourses: 0,
                limit: parseInt(limit)
            }
        });
    }

    // Return successful response with courses and pagination info
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Assigned courses retrieved successfully for instructor",
        data: courses,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCourses / parseInt(limit)),
            totalCourses: totalCourses,
            limit: parseInt(limit)
        }
    });
});

/**
 * ===============================================
 * GET ASSIGNED COURSE BY ID FOR INSTRUCTOR - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 12:45 PM
 * Purpose: Retrieve a specific assigned course by ID for instructor
 * Lines Modified: 380-420 (UPDATED FUNCTION)
 * Features: Complete course details with creator information
 * Note: Instructor can only view courses assigned to them
 * ===============================================
 */
const getCourseById = asyncWrapper(async (req, res) => {
    // Extract course ID from request parameters
    const { courseId } = req.params;

    // Validate course ID parameter
    if (!courseId) {
        throw new BAD_REQUEST("Course ID is required");
    }

    // Find course by ID that is assigned to this instructor
    const course = await courseModel
        .findOne({
            _id: courseId,
            "assignedInstructors.instructor": req.user.userId  // Only courses assigned to this instructor
        })
        .select("courseTitle courseCategory courseSubCategory courseAgeGroup courseLevel courseAccess coursePrice courseThumbnail courseOutline isCoursePublished courseVisibility createdBy assignedInstructors createdAt updatedAt")
        .populate('createdBy', 'firstName lastName email role')  // Populate creator info with role
        .lean();  // Convert to plain JavaScript object for better performance

    // Check if course exists and is assigned to instructor
    if (!course) {
        throw new NOT_FOUND("Course not found or not assigned to this instructor");
    }

    // Return successful response with complete course details
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Assigned course retrieved successfully",
        data: course
    });
});

/**
 * ===============================================
 * CREATE TIME SLOT FOR INSTRUCTOR - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 2:15 PM
 * Purpose: Create a new time slot for instructor availability
 * Lines Modified: 428-498 (NEW FUNCTION ADDED)
 * Features: Time validation, conflict checking, multiple days support
 * Note: Instructor can create multiple time slots for different days
 * ===============================================
 */
const createTimeSlot = asyncWrapper(async (req, res) => {
    // Extract time slot data from request body
    const { sessionTitle, scheduleType = 'Recurring Weekly', days, startTime, endTime } = req.body;

    // Validate required fields
    if (!sessionTitle || !days || !startTime || !endTime) {
        throw new BAD_REQUEST("Session title, days, start time, and end time are required");
    }

    // Check for time conflicts with existing slots
    const existingSlots = await availabilityModel.find({
        instructorId: req.user.userId,
        isActive: true,
        days: { $in: days }
    });

    // Check for overlapping time slots
    for (const slot of existingSlots) {
        for (const day of days) {
            if (slot.days.includes(day)) {
                const slotStart = new Date(`2000-01-01T${slot.startTime}:00`);
                const slotEnd = new Date(`2000-01-01T${slot.endTime}:00`);
                const newStart = new Date(`2000-01-01T${startTime}:00`);
                const newEnd = new Date(`2000-01-01T${endTime}:00`);

                // Check for time overlap
                if ((newStart < slotEnd && newEnd > slotStart)) {
                    throw new BAD_REQUEST(`Time slot conflicts with existing slot "${slot.sessionTitle}" on ${day} (${slot.startTime} - ${slot.endTime})`);
                }
            }
        }
    }

    // Create new time slot
    const timeSlot = new availabilityModel({
        instructorId: req.user.userId,
        sessionTitle,
        scheduleType,
        days,
        startTime,
        endTime
    });

    await timeSlot.save();

    // Populate instructor details for response
    const populatedSlot = await availabilityModel
        .findById(timeSlot._id)
        .populate('instructorId', 'firstName lastName email')
        .lean();

    // Return successful response
    res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Time slot created successfully",
        data: populatedSlot
    });
});

/**
 * ===============================================
 * GET ALL TIME SLOTS FOR INSTRUCTOR - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 2:20 PM
 * Purpose: Retrieve all time slots created by the authenticated instructor
 * Lines Modified: 500-600 (NEW FUNCTION ADDED)
 * Features: Pagination, filtering, search, summary statistics
 * Note: Instructor can view all their created time slots
 * ===============================================
 */
const getMyTimeSlots = asyncWrapper(async (req, res) => {
    // Extract query parameters
    const { page = 1, limit = 10, status, day, search } = req.query;

    // Build search object
    let searchObject = { instructorId: req.user.userId };

    // Add status filtering
    if (status === 'active') {
        searchObject.isActive = true;
    } else if (status === 'inactive') {
        searchObject.isActive = false;
    }

    // Add day filtering
    if (day) {
        searchObject.days = { $in: [day] };
    }

    // Add search functionality
    if (search) {
        searchObject.sessionTitle = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute database query
    const timeSlots = await availabilityModel
        .find(searchObject)
        .populate('instructorId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    // Get total count for pagination
    const totalSlots = await availabilityModel.countDocuments(searchObject);

    // Calculate summary statistics
    const totalActiveSlots = await availabilityModel.countDocuments({
        instructorId: req.user.userId,
        isActive: true
    });

    const totalWeeks = await availabilityModel.aggregate([
        { $match: { instructorId: req.user.userId, isActive: true } },
        { $group: { _id: null, uniqueWeeks: { $addToSet: "$scheduleType" } } }
    ]);

    // Check if no time slots found
    if (!timeSlots || timeSlots.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No time slots found",
            data: [],
            summary: {
                totalTimeSlots: 0,
                totalWeeks: 0,
                activeSlots: 0
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalSlots: 0,
                limit: parseInt(limit)
            }
        });
    }

    // Return successful response
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Time slots retrieved successfully",
        data: timeSlots,
        summary: {
            totalTimeSlots: totalSlots,
            totalWeeks: totalWeeks.length > 0 ? totalWeeks[0].uniqueWeeks.length : 0,
            activeSlots: totalActiveSlots
        },
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalSlots / parseInt(limit)),
            totalSlots: totalSlots,
            limit: parseInt(limit)
        }
    });
});

/**
 * ===============================================
 * UPDATE TIME SLOT FOR INSTRUCTOR - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 2:25 PM
 * Purpose: Update an existing time slot created by the instructor
 * Lines Modified: 602-681 (NEW FUNCTION ADDED)
 * Features: Conflict checking, validation, ownership verification
 * Note: Instructor can only update their own time slots
 * ===============================================
 */
const updateTimeSlot = asyncWrapper(async (req, res) => {
    // Extract slot ID and update data
    const { slotId } = req.params;
    const updateData = req.body;

    // Validate slot ID
    if (!slotId) {
        throw new BAD_REQUEST("Time slot ID is required");
    }

    // Find the time slot and verify ownership
    const existingSlot = await availabilityModel.findOne({
        _id: slotId,
        instructorId: req.user.userId
    });

    if (!existingSlot) {
        throw new NOT_FOUND("Time slot not found or you don't have permission to update it");
    }

    // Check for time conflicts if time is being updated
    if (updateData.startTime || updateData.endTime || updateData.days) {
        const daysToCheck = updateData.days || existingSlot.days;
        const startTime = updateData.startTime || existingSlot.startTime;
        const endTime = updateData.endTime || existingSlot.endTime;

        const conflictingSlots = await availabilityModel.find({
            _id: { $ne: slotId },
            instructorId: req.user.userId,
            isActive: true,
            days: { $in: daysToCheck }
        });

        // Check for overlapping time slots
        for (const slot of conflictingSlots) {
            for (const day of daysToCheck) {
                if (slot.days.includes(day)) {
                    const slotStart = new Date(`2000-01-01T${slot.startTime}:00`);
                    const slotEnd = new Date(`2000-01-01T${slot.endTime}:00`);
                    const newStart = new Date(`2000-01-01T${startTime}:00`);
                    const newEnd = new Date(`2000-01-01T${endTime}:00`);

                    if ((newStart < slotEnd && newEnd > slotStart)) {
                        throw new BAD_REQUEST(`Time slot conflicts with existing slot "${slot.sessionTitle}" on ${day} (${slot.startTime} - ${slot.endTime})`);
                    }
                }
            }
        }
    }

    // Update the time slot
    const updatedSlot = await availabilityModel
        .findByIdAndUpdate(
            slotId,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        )
        .populate('instructorId', 'firstName lastName email')
        .lean();

    // Return successful response
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Time slot updated successfully",
        data: updatedSlot
    });
});

/**
 * ===============================================
 * DELETE TIME SLOT FOR INSTRUCTOR - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 2:30 PM
 * Purpose: Delete a time slot created by the instructor
 * Lines Modified: 683-726 (NEW FUNCTION ADDED)
 * Features: Soft delete, ownership verification
 * Note: Instructor can only delete their own time slots
 * ===============================================
 */
const deleteTimeSlot = asyncWrapper(async (req, res) => {
    // Extract slot ID
    const { slotId } = req.params;

    // Validate slot ID
    if (!slotId) {
        throw new BAD_REQUEST("Time slot ID is required");
    }

    // Find the time slot and verify ownership
    const timeSlot = await availabilityModel.findOne({
        _id: slotId,
        instructorId: req.user.userId
    });

    if (!timeSlot) {
        throw new NOT_FOUND("Time slot not found or you don't have permission to delete it");
    }

    // Soft delete (set isActive to false)
    await availabilityModel.findByIdAndUpdate(slotId, {
        isActive: false,
        updatedAt: new Date()
    });

    // Return successful response
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Time slot deleted successfully"
    });
});

/**
 * ===============================================
 * GET INSTRUCTOR AVAILABILITY BY ID - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 3:00 PM
 * Purpose: View specific instructor's availability (used by Admin and Staff)
 * Lines Modified: 728-831 (NEW FUNCTION ADDED)
 * Features: Pagination, filtering, search, instructor validation
 * Note: This function can be called by Admin or Staff to view any instructor's availability
 * ===============================================
 */
const getInstructorAvailability = asyncWrapper(async (req, res) => {
    // Extract instructor ID and query parameters
    const { instructorId } = req.params;
    const { page = 1, limit = 10, status, day, search } = req.query;

    // Validate instructor ID
    if (!instructorId) {
        throw new BAD_REQUEST("Instructor ID is required");
    }

    // Verify instructor exists and has instructor role
    const instructor = await userModel.findOne({
        _id: instructorId,
        role: 'instructor'
    });

    if (!instructor) {
        throw new NOT_FOUND("Instructor not found with the provided ID");
    }

    // Build search object
    let searchObject = { instructorId };

    // Add status filtering
    if (status === 'active') {
        searchObject.isActive = true;
    } else if (status === 'inactive') {
        searchObject.isActive = false;
    }

    // Add day filtering
    if (day) {
        searchObject.days = { $in: [day] };
    }

    // Add search functionality
    if (search) {
        searchObject.sessionTitle = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute database query
    const timeSlots = await availabilityModel
        .find(searchObject)
        .populate('instructorId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    // Get total count for pagination
    const totalSlots = await availabilityModel.countDocuments(searchObject);

    // Calculate summary statistics
    const totalActiveSlots = await availabilityModel.countDocuments({
        instructorId,
        isActive: true
    });

    // Check if no time slots found
    if (!timeSlots || timeSlots.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No time slots found for this instructor",
            instructor: {
                _id: instructor._id,
                firstName: instructor.firstName,
                lastName: instructor.lastName,
                email: instructor.email
            },
            data: [],
            summary: {
                totalTimeSlots: 0,
                activeSlots: 0
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalSlots: 0,
                limit: parseInt(limit)
            }
        });
    }

    // Return successful response
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Instructor availability retrieved successfully",
        instructor: {
            _id: instructor._id,
            firstName: instructor.firstName,
            lastName: instructor.lastName,
            email: instructor.email
        },
        data: timeSlots,
        summary: {
            totalTimeSlots: totalSlots,
            activeSlots: totalActiveSlots
        },
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalSlots / parseInt(limit)),
            totalSlots: totalSlots,
            limit: parseInt(limit)
        }
    });
});

/**
 * ===============================================
 * GET ALL INSTRUCTORS AVAILABILITY - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 28, 2025
 * Time: 3:05 PM
 * Purpose: View all instructors' availability (used by Admin and Staff)
 * Lines Modified: 833-936 (NEW FUNCTION ADDED)
 * Features: Pagination, filtering, search, aggregated data
 * Note: This function can be called by Admin or Staff to view all instructors' availability
 * ===============================================
 */
const getAllInstructorsAvailability = asyncWrapper(async (req, res) => {
    // Extract query parameters
    const { page = 1, limit = 10, status, day, search, instructorId } = req.query;

    // Build search object
    let searchObject = {};

    // Add instructor filtering
    if (instructorId) {
        searchObject.instructorId = instructorId;
    }

    // Add status filtering
    if (status === 'active') {
        searchObject.isActive = true;
    } else if (status === 'inactive') {
        searchObject.isActive = false;
    }

    // Add day filtering
    if (day) {
        searchObject.days = { $in: [day] };
    }

    // Add search functionality
    if (search) {
        searchObject.sessionTitle = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute database query with aggregation
    const timeSlots = await availabilityModel
        .find(searchObject)
        .populate('instructorId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    // Get total count for pagination
    const totalSlots = await availabilityModel.countDocuments(searchObject);

    // Get aggregated statistics
    const stats = await availabilityModel.aggregate([
        { $match: searchObject },
        {
            $group: {
                _id: null,
                totalSlots: { $sum: 1 },
                activeSlots: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
                uniqueInstructors: { $addToSet: '$instructorId' }
            }
        }
    ]);

    // Check if no time slots found
    if (!timeSlots || timeSlots.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No time slots found",
            data: [],
            summary: {
                totalTimeSlots: 0,
                activeSlots: 0,
                totalInstructors: 0
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalSlots: 0,
                limit: parseInt(limit)
            }
        });
    }

    // Return successful response
    res.status(StatusCodes.OK).json({
        success: true,
        message: "All instructors availability retrieved successfully",
        data: timeSlots,
        summary: {
            totalTimeSlots: stats.length > 0 ? stats[0].totalSlots : 0,
            activeSlots: stats.length > 0 ? stats[0].activeSlots : 0,
            totalInstructors: stats.length > 0 ? stats[0].uniqueInstructors.length : 0
        },
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalSlots / parseInt(limit)),
            totalSlots: totalSlots,
            limit: parseInt(limit)
        }
    });
});
//hamza hanif
const getInstructorsThatAreAssignedToACourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found");

    const assignedInstructorIds = course.assignedInstructors
        .map((instructor) => instructor.instructor)
        .filter(Boolean);

    const instructors = await instructorModel.find({
        createdBy: { $in: assignedInstructorIds }
    }).populate([
        { path: "user" },
        { path: "availability", match: { isActive: true } }
    ]);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Assigned instructors fetched successfully",
        data: instructors,
    });
});

/**
 * Controller: Get instructors available to be assigned
 */
const getInstructorsThatCanBeAssignedToACourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found");

    const allInstructors = await instructorModel.find({
        coursePreferences: { $in: [courseId] }
    }).populate([
        {
            path: "user",
            select: "firstName lastName email profilePicture"
        },
        {
            path: "availability",
            match: { isActive: true }
        }
    ]);

    const alreadyAssignedIds = course.assignedInstructors.map((ai) => ai.instructor.toString());

    const instructorsNotAssigned = allInstructors.filter((instructor) => {
        return !alreadyAssignedIds.includes(instructor.createdBy?.toString());
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Instructors fetched successfully for this course",
        data: instructorsNotAssigned,
    });
});
//till here hamza hanif

//hamza hanif 11 27 25

const getVerifiedAndUnverifiedInstructorsCount = asyncWrapper(async (req, res) => {
    const verifiedInstructors = await instructorModel.countDocuments({
        "transcriptVerification.status": true
    });
    const unverifiedInstructors = await instructorModel.countDocuments({
        "transcriptVerification.status": false
    });
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Instructors fetched successfully for this course",
        data: {
            verifiedInstructors,
            unverifiedInstructors
        },
    });

});
const verifyInstructorDocument = asyncWrapper(async (req, res) => {
    const { instructorId } = req.body
    if (!instructorId) throw new BAD_REQUEST("instructor id is required in order to change the status of the user")
    const user = await userModel.findOne({ _id: instructorId })
    if (!user) throw new NOT_FOUND("no user with this id found");
    const instructor = await instructorModel.findOne({ createdBy: instructorId })
    if (!instructor) throw new NOT_FOUND(`No instructor found with this id ${instructorId}`)
    if (instructor.transcriptVerification.status === false) throw new BAD_REQUEST("Documents are not verified");
    instructor.transcriptVerification.status = true
    instructor.transcriptVerification.verifiedBy = req.user.userId
    instructor.transcriptVerification.verifiedAt = Date.now()
    instructor.newTranscriptRequest.status = false
    await instructor.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: "instructor document got verified mannually ",
        data: instructor,

    });
})
const requestNewTrancript = asyncWrapper(async (req, res) => {
    const { instructorId } = req.body
    if (!instructorId) throw new BAD_REQUEST("instructor id is required in order to change the status of the user")
    const user = await userModel.findOne({ _id: instructorId })
    if (!user) throw new NOT_FOUND("no user with this id found");
    const instructor = await instructorModel.findOne({ createdBy: instructorId })
    if (!instructor) throw new NOT_FOUND(`No instructor found with this id ${instructorId}`)
    if (instructor.transcriptVerification.status === true) throw new BAD_REQUEST("Documents are  verified");
    instructor.newTranscriptRequest.status = true
    await instructor.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: "instructor document request sent successfully ",
        data: instructor,
    });
})
const getNewInstructorsLast7DaysCount = asyncWrapper(async (req, res) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const count = await instructorModel.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        "transcriptVerification.status": false
    });
    res.status(StatusCodes.OK).json({
        success: true,
        message: "instructor document request sent successfully ",
        data: count,
    });
});



// abv
export {

    updateInstructorInformation,
    updateInstructorAcademicDetails,
    getInstructorProfile,
    changeInstructorPassword,
    getMyAssignedCourses,
    getCourseById,
    createTimeSlot,
    getMyTimeSlots,
    updateTimeSlot,
    deleteTimeSlot,
    getInstructorAvailability,
    getAllInstructorsAvailability,
    //added these two controllers by hamza 11/13/25
    getInstructorsThatAreAssignedToACourse,
    getInstructorsThatCanBeAssignedToACourse,
    //above 2 added by hamza hanif

    //11 27 25
    getNewInstructorsLast7DaysCount,
    getVerifiedAndUnverifiedInstructorsCount,
    verifyInstructorDocument,
    requestNewTrancript,
};
