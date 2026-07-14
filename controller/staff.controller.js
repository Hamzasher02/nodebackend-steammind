import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import staffModel from "../model/staff.model.js";
import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";
import { deleteFromCloud, uploadToCloud } from "../services/cloudinary.uploader.services.js";
import sendEmail from "../services/mailer.services.js";
import roleModel from "../model/role.model.js";
import { getInstructorAvailability, getAllInstructorsAvailability } from "./instructor.controller.js";
import crypto from 'crypto'
import deletionHistoryModel from '../model/deletionhistory.model.js'
const getStaffWithNoRoleAssignedYet = asyncWrapper(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { role: null, isDeleted: false };

    const totalStaff = await staffModel.countDocuments(query);

    if (!totalStaff) {
        throw new NOT_FOUND("Please create a new user to assign a role");
    }

    const staffWithNoRoleAssignedYet = await staffModel
        .find(query)
        .select("email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All user with no role assigned yet",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalStaff / limit),
            totalStaff,
            limit
        },
        data: staffWithNoRoleAssignedYet
    });
});

const getStaffwithAssignedRole = asyncWrapper(async (req, res) => {
    const { role, status } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchObject = {
        isDeleted: false
    };

    if (role) {
        searchObject.role = { $regex: role, $options: 'i' };
    } else {
        searchObject.role = { $ne: null };
    }

    if (status) {
        searchObject.roleStatus = { $regex: status, $options: 'i' };
    }

    const totalStaff = await staffModel.countDocuments(searchObject);

    if (!totalStaff) {
        throw new NOT_FOUND("Please create a new user to assign a role");
    }

    const staffWithRolesAssigned = await staffModel
        .find(searchObject)
        .select("email role roleStatus")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All user with assigned roles",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalStaff / limit),
            totalStaff,
            limit
        },
        data: staffWithRolesAssigned
    });
});

const getStaffWithStatusPending = asyncWrapper(async (req, res) => {
    const { role } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchObject = {
        roleStatus: "pending",
        isDeleted:false
    };

    if (role) {
        searchObject.role = { $regex: role, $options: "i" };
    } else {
        searchObject.role = { $ne: null };
    }

    const totalStaff = await staffModel.countDocuments(searchObject);

    if (!totalStaff) {
        throw new NOT_FOUND("all users have roles assigned");
    }

    const staffWithNoRoleAssignedYet = await staffModel
        .find(searchObject)
        .select("email role roleStatus")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "All user with no role assigned yet",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalStaff / limit),
            totalStaff,
            limit
        },
        data: staffWithNoRoleAssignedYet
    });
});

const getAllStaff = asyncWrapper(async (req, res) => {
    const { search } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { isDeleted: false };

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }

    const totalStaff = await staffModel.countDocuments(query);

    if (!totalStaff) {
        throw new NOT_FOUND("No staff found");
    }

    const allStaff = await staffModel
        .find(query)
        .select(
            "-password -isDeleted -deletedAt -deletedBy -restoredAt -restoredBy -__v -cryptoToken"
        )
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Staff fetched successfully",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalStaff / limit),
            totalStaff,
            limit
        },
        data: allStaff
    });
});

const getSingleStaff = asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const staff = await staffModel
        .findOne({ _id: id, isDeleted: false })
        .select(
            "-isDeleted  -deletedAt -deletedBy -restoredAt -restoredBy -cryptoToken"
        );

    if (!staff) {
        throw new NOT_FOUND("no staff found with this id");
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "staff fetched successfully",
        data: [staff]
    });
});
const toggleStaffStatus = asyncWrapper(async (req, res) => {

    const { staffId } = req.body;
    const staff = await staffModel.findById(staffId);
    if (!staff) throw new NOT_FOUND("No staff found with this staffId");
    if (staff.role === 'admin') throw new BAD_REQUEST("admin role can not be changed")
    if (req.user.userId == staffId) throw new BAD_REQUEST("User can not change its own role")
    // Toggle roleStatus
    staff.roleStatus = staff.roleStatus === "active" ? "inactive" : "active";

    await staff.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: `Staff status updated to ${staff.roleStatus}`,
        data: [{
            id: staff._id,
            email: staff.email,
            roleStatus: staff.roleStatus
        }]
    });
});

const updateStaffRole = asyncWrapper(async (req, res) => {
    const { roleName, email } = req.body
    const singleUser = await staffModel.findOne({ email })
    if (singleUser.role === 'admin') throw new BAD_REQUEST("Admin role cnt be changed");
    if (req.user.userId == singleUser._id) throw new BAD_REQUEST("user can not update its own information")
    if (!singleUser) throw new NOT_FOUND(`no user found with this email: ${email}`);
    const singleRole = await roleModel.findOne({ name: roleName })
    if (!singleRole) throw new NOT_FOUND(`no role found with this name: ${roleName}`);
    if (singleRole.role === roleName) throw new BAD_REQUEST("Same role is assigned to the user.")
    singleUser.roleStatus = 'inactive';
    singleUser.role = singleRole.name
    const secret = crypto.randomBytes(40).toString('hex')
    singleUser.cryptoToken = secret
    const verificationUrl = `${process.env.BASE_URL + process.env.BASE_PATH}/staff/verifyStaffStatus/${singleUser._id}/${secret}`
    // yeh url auth main bana lyna ya sir sy discuss kr k seh lagy tme
    await sendEmail({
        to: email,
        subject: `Join Steam mind as a ${singleRole.name}`,
        text: verificationUrl
    })
    await singleUser.save()
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "role acceptance email sent.once user accept role will be updated",
        data: [singleUser]
    })
})
const searchStaff = asyncWrapper(async (req, res) => {
    const { name } = req.body;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
        $or: [
            { firstName: { $regex: name, $options: 'i' } },
            { lastName: { $regex: name, $options: 'i' } },
            { email: { $regex: name, $options: 'i' } },
        ]
    };

    const totalStaff = await staffModel.countDocuments(query);

    if (!totalStaff) {
        throw new NOT_FOUND("no staff found with this name or email");
    }

    const staff = await staffModel
        .find(query)
        .skip(skip)
        .limit(limit).select(
            "-isDeleted  -deletedAt -deletedBy -restoredAt -restoredBy -cryptoToken"
        )
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "staff members",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalStaff / limit),
            totalStaff,
            limit
        },
        data: staff
    });
});

const verifyRoleStatus = asyncWrapper(async (req, res) => {
    const { userId, secret } = req.params
    const singleUser = await staffModel.findOne({ _id: userId, cryptoToken: secret })

    if (!singleUser) throw new NOT_FOUND(`no user found`);
    singleUser.roleStatus = "active"
    singleUser.cryptoToken = null
    await singleUser.save()
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "role assigned successfully",
        data: [{
            name: `${singleUser.firstName} ${singleUser.lastName}`,
            role: singleUser.role,
            roleStatus: singleUser.roleStatus
        }]
    })
})
const assignRole = asyncWrapper(async (req, res) => {
    const { roleName, email } = req.body
    const singleUser = await staffModel.findOne({ email }).select("-isDeleted  -deletedAt -deletedBy -restoredAt -restoredBy -cryptoToken")
    if (singleUser._id == req.user.userId) throw new BAD_REQUEST("User can not assign role to its self")
    if (!singleUser) throw new NOT_FOUND(`no role found with this email: ${email}`);
    if (singleUser.role !== null && singleUser.roleStatus == "active") throw new BAD_REQUEST("Role is already assigned to the user");
    const singleRole = await roleModel.findOne({ name: roleName })
    if (!singleRole) throw new NOT_FOUND(`no role found with this name: ${roleName}`);
    singleUser.role = singleRole.name
    const secret = crypto.randomBytes(40).toString('hex')
    singleUser.cryptoToken = secret
    const verificationUrl = `${process.env.BASE_URL + process.env.BASE_PATH}/staff/verifyStaffStatus/${singleUser._id}/${secret}`
    // yeh url auth main bana lyna ya sir sy discuss kr k seh lagy tme
    await sendEmail({
        to: email,
        subject: `Join Steam mind as a ${singleRole.name}`,
        text: verificationUrl
    })
    singleUser.roleStatus = "pending"
    await singleUser.save()
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "role acceptance email sent.once user accept role will be assigned",
        data: [singleUser]
    })
})
const registerStaff = asyncWrapper(async (req, res) => {
    const { email, password, firstName, lastName } = req.body
    if (!req.file) throw new BAD_REQUEST("Please provide profile picture");
    if (!req.file.mimetype.startsWith('image/')) {
        throw new BAD_REQUEST("Please provide valid image format.")
    }
    const isEmailAlreadyExist = await staffModel.findOne({ email })
    if (isEmailAlreadyExist) throw new BAD_REQUEST("user already exist with this email")
    const { publicId, secureUrl } = await uploadToCloud(req.file.path)
    if (!publicId || !secureUrl) {
        throw new INTERNAL_SERVER_ERROR("Unable to uplaod file to the server please provide a valid file")
    }
    cleanupUploadedFiles(req)
    const user = await staffModel.create({
        firstName, lastName, email, password, createdBy: req.user.userId, profilePicture: {
            publicId, secureUrl
        }
    })
    res.status(StatusCodes.OK).json({
        sucess: true,
        message: "user created successfully",
        data: []
    })
})
//getmoduleofa publish course
//inststrutor location etc
const removeStaffWithPendingStatus = asyncWrapper(async (req, res) => {

    
    const { email } = req.body;
    if (!email) {
        throw new BAD_REQUEST("Please provide staff email");
    }
    const staff = await staffModel.findOne({
        email,
        roleStatus: "pending",
        isDeleted: false
    });
    
    
    if (!staff) {
        throw new BAD_REQUEST(
            "No pending staff found with this email or staff already deleted"
        );
    }
    staff.isDeleted = true;
    staff.deletedAt = new Date();
    staff.deletedBy = req.user?.userId || null;

    await staff.save();

    const deletionRecord = new deletionHistoryModel({
        itemId: staff._id,
        itemName: `${staff.firstName} ${staff.lastName}`,
        itemModel: "Staff",
        performedBy: req.user?.userId,
        affectedRefs: []
    });

    await deletionRecord.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Staff with pending status deleted successfully",
        data: {
            email: staff.email,
            roleStatus: staff.roleStatus
        }
    });
});
const restoreStaffWithPendingStatus = asyncWrapper(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new BAD_REQUEST("Please provide staff email");
    const staff = await staffModel.findOne({ email, isDeleted: true });
    if (!staff) throw new NOT_FOUND("No deleted staff found with this email");
    const deletionRecord = await deletionHistoryModel.findOne({
        itemId: staff._id,
        itemModel: "Staff"
    });
    if (deletionRecord) {
        await deletionHistoryModel.deleteOne({ _id: deletionRecord._id });
    }
    staff.isDeleted = false;
    staff.restoredAt = new Date();
    staff.restoredBy = req.user?.userId || null;
    staff.deletedAt = null;
    staff.deletedBy = null;
    await staff.save();
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Staff restored successfully",
        data: staff
    });
});

const deleteStaffPermanently = asyncWrapper(async (req, res) => {
    const { staffId } = req.params;

    if (!staffId) throw new BAD_REQUEST("Please provide staffId");
    const staff = await staffModel.findById(staffId);

    if (!staff || staff.isDeleted === false) {
        throw new BAD_REQUEST(
            "Staff must be soft deleted before permanent deletion"
        );
    }
    const history = await deletionHistoryModel.findOne({
        itemId: staffId,
        itemModel: "Staff"
    });

    if (!history) {
        throw new NOT_FOUND("No deletion history found for this staff");
    }
    if (staff.profilePicture && staff.profilePicture.publicId) {
        await deleteFromCloud(staff.profilePicture.publicId);
    }

    await staffModel.findByIdAndDelete(staffId);
    await deletionHistoryModel.findByIdAndDelete(history._id);

    res.status(200).json({
        success: true,
        message: "Staff and associated assets permanently deleted from system",
        data: []
    });
});
/**
 * ===============================================
 * STAFF CONTROLLER - HAMZA SHER
 * ===============================================
 * Note: getInstructorAvailability and getAllInstructorsAvailability 
 * are imported from instructor.controller.js (moved on October 28, 2025)
 * All instructor-related availability logic is now centralized in instructor controller
 * ===============================================
 */

export { getAllStaff, getStaffWithNoRoleAssignedYet, getStaffwithAssignedRole, verifyRoleStatus, assignRole, registerStaff, getStaffWithStatusPending, getSingleStaff, toggleStaffStatus, searchStaff, updateStaffRole, getInstructorAvailability, getAllInstructorsAvailability,
   //eyh neechy 3 new apis hain aur yeh test nh ki
    removeStaffWithPendingStatus,restoreStaffWithPendingStatus,deleteStaffPermanently
 }