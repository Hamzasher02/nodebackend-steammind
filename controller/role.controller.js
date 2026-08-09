import { StatusCodes } from 'http-status-codes'
import asyncWrapper from '../middleware/asyncWrapper.js'
import roleModel, { PERMISSIONS, ROUTES } from '../model/role.model.js'
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js'
import makeRoutesConsistent from '../utils/roles.helper.js'
import staffModel from '../model/staff.model.js'
import deletionHistoryModel from '../model/deletionhistory.model.js'
const createRole = asyncWrapper(async (req, res) => {
    const {
        name,
        description,
        routePermission = []
    } = req.body
    if (name === 'admin') throw new BAD_REQUEST("role name can not be admin");
    if (routePermission.length === 0) {
        throw new BAD_REQUEST("Please provide atleast one route and one permission")
    }
    const uniqueRoutesAndPermissions = makeRoutesConsistent({ ROUTES, PERMISSIONS, routePermission })
    const role = await roleModel.create({ name, description, createdBy: req.user.userId, routePermission: uniqueRoutesAndPermissions })
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Role created successfully.",
        data: role
    })
})

const getAllRoles = asyncWrapper(async (req, res) => {
    const allRoles = await roleModel.find({isDeleted:false}).select("name description type routePermission")
    if (allRoles.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No role found.",
            data: {}
        })
    }
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "All roles.",
        data: allRoles
    })
})
const getSingleRole = asyncWrapper(async (req, res) => {
    const { roleId } = req.params
    if (!roleId) throw new BAD_REQUEST("please provide id")
    const singleRole = await roleModel.findOne({ _id: roleId,isDeleted:false })
    if (!singleRole) throw new NOT_FOUND(`no role found with this id: ${roleId}`);
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "single role information.",
        data: singleRole
    })
})
const updateRole = asyncWrapper(async (req, res) => {
    const { roleId } = req.body
    if (!roleId) throw new BAD_REQUEST("please provide id")
    const singleRole = await roleModel.findOne({ _id: roleId,isDeleted:false })
    if (!singleRole) throw new NOT_FOUND(`no role found with this id: ${roleId}`);
    const { name, description, routePermission } = req.body
    let updateRoleObject = {}
    if (name) updateRoleObject.name = name;
    if (description) updateRoleObject.description = description;
    if (routePermission) {
        //front end will provide prev as well as new permissions
        if (!Array.isArray(routePermission)) throw new BAD_REQUEST("pleaes provide valid data to update");
        if (routePermission.length === 0) throw new BAD_REQUEST("please provide something to update");
        const updatedConsistentPermission = makeRoutesConsistent({ ROUTES, PERMISSIONS, routePermission })
        updateRoleObject.routePermission = updatedConsistentPermission
    }
    const updatedRole = await roleModel.findOneAndUpdate({ _id: roleId }, updateRoleObject, { runValidators: true, new: true })
    return res.status(StatusCodes.OK).json({
        success: true,
        message: "role updated successfully.",
        data: updatedRole
    })
})
const deleteRole = asyncWrapper(async (req, res) => {
    const { roleId } = req.body;

    if (!roleId) throw new BAD_REQUEST("Please provide roleId");

    const role = await roleModel.findOne({ _id: roleId, isDeleted: false });

    if (!role) throw new NOT_FOUND(`No role found with this id: ${roleId}`);
    await staffModel.updateMany(
        { role: role.name },
        { $set: { roleStatus: "inactive" } }
    );
    role.isDeleted = true;
    role.deletedAt = new Date();
    role.deletedBy = req.user?.userId || null;

    await role.save();

    const deletionRecord = new deletionHistoryModel({
        itemId: role._id,
        itemName: role.name,
        itemModel: "Role",
        performedBy: req.user?.userId,
        affectedRefs: [] 
    });

    await deletionRecord.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Role soft deleted successfully",
        data: role
    });
});

// restore role
const restoreRole = asyncWrapper(async (req, res) => {
    const { roleId } = req.body;
    if (!roleId) throw new BAD_REQUEST("Please provide roleId");
    const role = await roleModel.findOne({ _id: roleId, isDeleted: true });
    if (!role) throw new NOT_FOUND(`No deleted role found with this id: ${roleId}`);
    const deletionRecord = await deletionHistoryModel.findOne({ itemId: roleId, itemModel: "Role" });
    if (deletionRecord) {
        await deletionHistoryModel.deleteOne({ _id: deletionRecord._id });
    }
    role.isDeleted = false;
    role.restoredAt = new Date();
    role.restoredBy = req.user?.userId || null;
    role.deletedAt = null;
    role.deletedBy = null;
    await role.save();
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Role restored successfully",
        data: role
    });
});



export { createRole, getAllRoles, getSingleRole, updateRole, deleteRole,restoreRole }