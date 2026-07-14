import nameChangeRequestModel from "../model/namechangerequest.model.js";
import userModel from "../model/user.model.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";
const createNameChangeRequest = asyncWrapper(async (req, res) => {
    const { firstName, lastName, reasonForCorrection } = req.body;
    const exists = await nameChangeRequestModel.findOne({
        createdBy: req.user.userId,
        isApproved: false
    });

    if (exists) throw new BAD_REQUEST("Pending request already exists");

    const request = await nameChangeRequestModel.create({
        firstName,
        lastName,
        reasonForCorrection,
        createdBy: req.user.userId
    });

    res.status(201).json({
        success: true,
        message: "Name change request submitted",
        data: request
    });
});
const getAllNameChangeRequests = asyncWrapper(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await nameChangeRequestModel.countDocuments();

    if (!total) throw new NOT_FOUND("No name change requests found");

    const requests = await nameChangeRequestModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: "createdBy",
            select: "firstName lastName email role profilePicture.secureUrl"
        });

    res.status(200).json({
        success: true,
        message: "Name change requests fetched",
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        },
        data: requests
    });
});
const getSingleNameChangeRequest = asyncWrapper(async (req, res) => {
    const request = await nameChangeRequestModel
        .findById(req.params.id)
        .populate({
            path: "createdBy",
            select: "firstName lastName email role profilePicture.secureUrl"
        });

    if (!request) throw new NOT_FOUND("Request not found");

    res.status(200).json({
        success: true,
        data: request
    });
});
const approveOrRejectNameChangeRequest = asyncWrapper(async (req, res) => {
    const request = await nameChangeRequestModel.findById(req.params.id);
    const {isApproved=true}=req.body
    if (!request) throw new NOT_FOUND("Request not found");

    if (request.isApproved) throw new BAD_REQUEST("Request already approved");
  //aprove request woh chagne nh kr skta
  //agr koi reject ki hy aur bde main woh change krna cha rha toh yaha sy woh change kr skta hy
    await userModel.findByIdAndUpdate(
        request.createdBy,
        {
            firstName: request.firstName,
            lastName: request.lastName
        },
        { new: true }
    );

    request.isApproved = isApproved;
    await request.save();

    res.status(200).json({
        success: true,
        message: `Name change request ${isApproved==true?"Accepted":"Rejected"}`,
        data:[]
    });
});



export { approveOrRejectNameChangeRequest, createNameChangeRequest, getAllNameChangeRequests, getSingleNameChangeRequest }