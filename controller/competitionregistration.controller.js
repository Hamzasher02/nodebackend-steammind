import { NOT_FOUND, BAD_REQUEST } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import competitionRegistrationModel from '../model/competitionregistration.model.js';
import mongoose from 'mongoose';

// 1. Get All Registrations (with Searching, Filtering, Pagination, and KPI metrics)
const getRegistrations = asyncWrapper(async (req, res) => {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
        query.status = status;
    }
    if (search) {
        query.$or = [
            { studentName: { $regex: search, $options: 'i' } },
            { teamName: { $regex: search, $options: 'i' } }
        ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    const registrations = await competitionRegistrationModel.find(query)
        .populate('competitionId', 'title')
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum);

    const totalCount = await competitionRegistrationModel.countDocuments(query);

    // KPI Metrics calculation
    const totalRegistrations = await competitionRegistrationModel.countDocuments();
    const confirmedRegistrations = await competitionRegistrationModel.countDocuments({ status: 'confirmed' });
    const pendingRegistrations = await competitionRegistrationModel.countDocuments({ status: 'pending' });
    const canceledRegistrations = await competitionRegistrationModel.countDocuments({ status: 'canceled' });

    res.status(200).json({
        success: true,
        data: registrations,
        meta: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalResults: totalCount,
            kpis: {
                total: totalRegistrations,
                confirmed: confirmedRegistrations,
                pending: pendingRegistrations,
                canceled: canceledRegistrations
            }
        }
    });
});

// 2. Create Registration
const createRegistration = asyncWrapper(async (req, res) => {
    const { competitionId, competition, studentName, parentName, parentEmail, parentPhone, grade, schoolName, teamName, teamSize } = req.body;

    const targetCompId = competitionId || competition;

    const newReg = await competitionRegistrationModel.create({
        competitionId: mongoose.Types.ObjectId.isValid(targetCompId) ? targetCompId : null,
        studentName: studentName || 'Student Participant',
        parentName: parentName || '',
        parentEmail: parentEmail || '',
        parentPhone: parentPhone || '',
        grade: grade || 'Grade 8',
        schoolName: schoolName || '',
        teamName: teamName || '',
        teamSize: teamSize || { min: 1, max: 4 },
        status: 'pending'
    });

    res.status(201).json({
        success: true,
        message: 'Registration submitted successfully',
        data: newReg
    });
});

// 3. Update Registration Status
const updateRegistrationStatus = asyncWrapper(async (req, res) => {
    const { registrationId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
        throw new BAD_REQUEST('Invalid Registration ID format');
    }

    const reg = await competitionRegistrationModel.findById(registrationId);
    if (!reg) {
        throw new NOT_FOUND('Registration not found');
    }

    if (status) {
        reg.status = status;
    }
    await reg.save();

    res.status(200).json({
        success: true,
        message: `Registration status updated successfully`,
        data: reg
    });
});

export {
    getRegistrations,
    createRegistration,
    updateRegistrationStatus
};
