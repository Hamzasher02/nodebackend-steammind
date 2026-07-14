import { StatusCodes } from "http-status-codes"
import asyncWrapper from "../middleware/asyncWrapper.js"
import userModel from "../model/user.model.js"
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../error/error.js"
import { deleteFromCloud, uploadToCloud } from "../services/cloudinary.uploader.services.js"
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js"
import studentModel from "../model/student.model.js"
import instructorModel from "../model/instructor.model.js"
import staffModel from "../model/staff.model.js"
import enrollmentModel from "../model/enrollment.model.js"

const showCurrentUser = asyncWrapper(async (req, res) => {
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Curent user data',
        data: req.user
    })
})
const getSingleStudent = asyncWrapper(async (req, res) => {
    // name , email profile , 
    //courses info ... will add later jab course module py kaam hoga 
    // for now i am jsut sedning name email and profile 
    const user = await userModel.findOne({ _id: req.user.userId }).select("email profilePicture firstName lastName")
    let frontEndResponse = {};
    if (!user) throw new NOT_FOUND("User not found");
    if (user.lastName && user.firstName) frontEndResponse["name"] = `${user.firstName} ${user.lastName}`;
    if (user.email) frontEndResponse["email"] = user.email;
    if (user.profilePicture) frontEndResponse["profilePicture"] = user.profilePicture.secureUrl;
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Curent user data',
        data: frontEndResponse
    })
})
const getSingleInstructor = asyncWrapper(async (req, res) => {
    const user = await userModel.findOne({ _id: req.user.userId }).select("email profilePicture firstName lastName createdAt")
    let frontEndResponse = {};
    if (!user) throw new NOT_FOUND("User not found");
    if (user.lastName && user.firstName) frontEndResponse["name"] = `${user.firstName} ${user.lastName}`;
    if (user.email) frontEndResponse["email"] = user.email;
    if (user.profilePicture) frontEndResponse["profilePicture"] = user.profilePicture.secureUrl;
    if (user.createdAt) frontEndResponse["createdAt"] = user.createdAt;
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Curent user data',
        data: frontEndResponse
    })

})
const updateStudentInformation = asyncWrapper(async (req, res) => {
    let publicid;
    let profilePictureToBeDeleted = null;
    let informationToBeUpdated = {}
    const {  parentPhoneNumber, phoneNumber, grade, bio } = req.body
 
    if (parentPhoneNumber) informationToBeUpdated.parentPhoneNumber = parentPhoneNumber;
    if (phoneNumber) informationToBeUpdated.phoneNumber = phoneNumber;
    if (grade) informationToBeUpdated.grade = grade;
    if (bio) informationToBeUpdated.bio = bio;
    const user = await userModel.findOne({ _id: req.user.userId })
    if (!user) throw new NOT_FOUND("no user exist with this id")
    if (req.file) {
        if (!req.file.mimetype.startsWith('image/')) {
            throw new BAD_REQUEST("Please provide valid image format.")
        }
        try {
            const profilePictureCloud = await uploadToCloud(req.file.path)
            publicid = profilePictureCloud.publicId
            if (!profilePictureCloud.publicId || !profilePictureCloud.secureUrl) {
                throw new INTERNAL_SERVER_ERROR("Unable to uplaod file to the server please provide a valid file")
            }
            informationToBeUpdated.profilePicture = { ...profilePictureCloud }
            profilePictureToBeDeleted = user.profilePicture.publicId
        } catch (err) {
            await deleteFromCloud(publicid)
            throw err
        }
    }
    if (Object.keys(informationToBeUpdated).length <= 0) throw new BAD_REQUEST("Please provide something to update")
    const updatedUserInformation = await userModel.findOneAndUpdate({ _id: req.user.userId }, informationToBeUpdated, { runValidators: true, new: true })
    const updatedStudentInformation = await studentModel.findOneAndUpdate({ createdBy: req.user.userId }, informationToBeUpdated, { runValidators: true, new: true })
    if (profilePictureToBeDeleted) {
        cleanupUploadedFiles(req)
        await deleteFromCloud(profilePictureToBeDeleted)
    };
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User update successfully.',
        data: {
            
            parentPhoneNumber: updatedStudentInformation?.parentPhoneNumber,
            bio: updatedUserInformation?.bio,
            phoneNumber: updatedUserInformation?.phoneNumber,
            grade: updatedStudentInformation?.grade,
            profilePicture: updatedUserInformation?.profilePicture.secureUrl
        }
    })
})

const getAllUsers = asyncWrapper(async (req, res) => {
    //make sure to protect this with role baased authentication like only admin can access this
    const users = await userModel.find({})
    res.status(StatusCodes.OK).json({
        success: true,
        message: "all users",
        data: users
    })
})

const getAllStudents = asyncWrapper(async (req, res) => {
    const { search, status } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchObject = { role: "student" };

    if (search) {
        searchObject.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } }
        ];
    }

    if (status) searchObject.accountStatus = status;

    const totalStudents = await userModel.countDocuments(searchObject);

    if (!totalStudents) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "No students found",
            data: []
        });
    }
    const students = await userModel
        .find(searchObject)
        .select("firstName lastName email profilePicture role accountStatus")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    const enrollments = await enrollmentModel
        .find({ user: { $in: students.map(s => s._id) } })
        .populate("course", "courseTitle")
        .populate("user", "firstName lastName");
    const result = students.map(student => {
        const studentCourses = enrollments
            .filter(en => en.user._id.toString() === student._id.toString())
            .map(en => en.course.courseTitle);

        return {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            accountStatus: student.accountStatus,
            profilePicture: student.profilePicture,
            courses: studentCourses
        };
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Students fetched successfully",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalStudents / limit),
            totalStudents,
            limit
        },
        data: [result]
    });
});
const getAllInstructors = asyncWrapper(async (req, res) => {
    const { search, status } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchObject = { role: "instructor" };

    if (search) {
        searchObject.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } }
        ];
    }

    if (status) searchObject.accountStatus = status;

    const totalInstructors = await userModel.countDocuments(searchObject);

    if (!totalInstructors) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "No instructor found",
            data: []
        });
    }

    const instructors = await userModel
        .find(searchObject)
        .select("firstName lastName email profilePicture role accountStatus")
        .populate("instructor")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All instructors",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalInstructors / limit),
            totalInstructors,
            limit
        },
        data: instructors
    });
});
const changeStudentAccountStatus = asyncWrapper(async (req, res) => {
    const { studentId, accountStatus } = req.body
    if (!studentId) throw new BAD_REQUEST("student id is required in order to change the status of the user")
    const student = await userModel.findOne({ _id: studentId })
    if (!student) throw new NOT_FOUND(`No student found with this id ${studentId}`)
    student.accountStatus = accountStatus
    await student.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Student status changed successfully ",
        data: student,

    });

})
// this one will now update 
//11 27 25
const changeInstructorAccountStatus = asyncWrapper(async (req, res) => {
    const { instructorId, accountStatus } = req.body
    if (!instructorId) throw new BAD_REQUEST("instructor id is required in order to change the status of the user")
    const user = await userModel.findOne({ _id: instructorId })
    if (!user) throw new NOT_FOUND("no user with this id found");
    const instructor = await instructorModel.findOne({ createdBy: instructorId })
    if (!instructor) throw new NOT_FOUND(`No instructor found with this id ${instructorId}`)

    if (instructor.transcriptVerification.status !== true) throw new BAD_REQUEST("Documents are not verified");
    user.accountStatus = accountStatus
    await user.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: "instructor status changed successfully ",
        data: instructor,

    });
})
//update till here


// const deleteInstructor = asyncWrapper(async (req, res) => {
//     const { instructorId } = req.body;
//     if (!instructorId) throw new BAD_REQUEST("Instructor ID is required");

//     const session = await mongo.startSession();
//     try {
//         session.startTransaction();

//         const instructor = await userModel.findOne({ _id: instructorId }).session(session);
//         if (!instructor) throw new NOT_FOUND(`No instructor found with ID ${instructorId}`);
//         await instructorModel.findOneAndDelete({ createdBy: instructorId }).session(session);
//         await userModel.findOneAndDelete({ _id: instructorId }).session(session);
//         await deleteFromCloud(instructor.profilePicture.publicId);
//         await session.commitTransaction();
//         session.endSession();

//         res.status(StatusCodes.OK).json({
//             success: true,
//             message: "Instructor deleted successfully",
//             data: instructor,
//         });
//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         throw error;
//     }
// });

const getStudentBasicInformation = asyncWrapper(async (req, res) => {
    const { studentId } = req.params
    if (!studentId) throw new BAD_REQUEST("student id is required in order to change the status of the user")
    const student = await userModel.findOne({ _id: studentId }).select("_id email accountStatus phoneNumber  ").populate({
        path: "student", select: "grade level"
    })
    //level ageGroup courses
    if (!student) throw new NOT_FOUND(`No student found with this id ${studentId}`)

    await student.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Student role changed successfully ",
        data: student,

    });

})
const toggleStudentStatus = asyncWrapper(async (req, res) => {
    console.log('i am hit');
    console.log(req.body);
    
    
    const { studentId } = req.body;
    if (!studentId) throw new BAD_REQUEST("Please provide a studentId");
    const studentUser = await userModel.findById(studentId);
    if (!studentUser) throw new NOT_FOUND("No user found with this studentId");
    if (studentUser.role !== 'student') throw new BAD_REQUEST("This user is not a student");
    if (studentUser.isDeleted) throw new BAD_REQUEST("Cannot toggle status of a deleted student");
    if (req.user.userId === studentId) throw new BAD_REQUEST("You cannot change your own status");
    studentUser.accountStatus = studentUser.accountStatus === "active" ? "inactive" : "active";
    await studentUser.save();
    res.status(StatusCodes.OK).json({
        success: true,
        message: `Student status updated to ${studentUser.accountStatus}`,
        data: [{
            id: studentUser._id,
            email: studentUser.email,
            accountStatus: studentUser.accountStatus
        }]
    });
});

export { toggleStudentStatus, showCurrentUser, getSingleStudent, getSingleInstructor, updateStudentInformation, getAllUsers, getAllStudents, getAllInstructors, changeStudentAccountStatus, getStudentBasicInformation, changeInstructorAccountStatus, changePassword, changeAdminPassword }


/**
 * ===============================================
 * STUDENT PASSWORD CHANGE CONTROLLER - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 27, 2025
 * Time: 10:55 AM
 * Purpose: Handle password change for students with security validation
 * Lines Modified: 283-316 (FUNCTION IMPLEMENTATION)
 * ===============================================
 */
const changePassword = asyncWrapper(async (req, res) => {
    // Extract current and new passwords from request body
    const { currentPassword, newPassword } = req.body;

    // Find user with password field included (password is normally hidden with select: false)
    const user = await userModel.findOne({ _id: req.user.userId }).select("+password");
    if (!user) throw new NOT_FOUND("No user exists with this id");  // Check if user exists

    // Verify current password using bcrypt comparison
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {  // If current password is wrong
        throw new BAD_REQUEST("Current password is incorrect");  // Return error
    }

    // Check if new password is different from current password (security measure)
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {  // If new password is same as current
        throw new BAD_REQUEST("New password must be different from current password");  // Return error
    }

    // Update password (bcrypt will automatically hash it due to pre-save middleware)
    user.password = newPassword;
    await user.save();  // Save to database

    // Return success response
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Password changed successfully.',
        data: {}  // Empty data object as per project pattern
    });
});

/**
 * ===============================================
 * ADMIN PASSWORD CHANGE CONTROLLER - HAMZA SHER
 * ===============================================
 * Created by: Hamza Sher
 * Date: October 27, 2025
 * Time: 11:00 AM
 * Purpose: Handle password change for admin users with security validation
 * Lines Modified: 325-367 (FUNCTION MOVED FROM ADMIN CONTROLLER)
 * Note: Admin uses staff model with role='admin'
 * ===============================================
 */
const changeAdminPassword = asyncWrapper(async (req, res) => {
    // Extract current and new passwords from request body
    const { currentPassword, newPassword } = req.body;

    // Find admin with password field included (admin is stored in staff model)
    const admin = await staffModel.findOne({ _id: req.user.userId }).select("+password");
    if (!admin) throw new NOT_FOUND("No admin exists with this id");  // Check if admin exists

    // Verify current password using bcrypt comparison
    const isCurrentPasswordCorrect = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {  // If current password is wrong
        throw new BAD_REQUEST("Current password is incorrect");  // Return error
    }

    // Check if new password is different from current password (security measure)
    const isSamePassword = await admin.comparePassword(newPassword);
    if (isSamePassword) {  // If new password is same as current
        throw new BAD_REQUEST("New password must be different from current password");  // Return error
    }

    // Update password (bcrypt will automatically hash it due to pre-save middleware)
    admin.password = newPassword;
    await admin.save();  // Save to database

    // Return success response
    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Password changed successfully.',
        data: {}  // Empty data object as per project pattern
    });
});

