import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from "../error/error.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import courseModel from "../model/course.model.js";
import courseModuleModel from "../model/coursemodule.model.js";
import pdfMaterialModel from "../model/coursepdfmaterials.model.js";
import deletionHistoryModel from "../model/deletionhistory.model.js";
import enrollmentModel from "../model/enrollment.model.js";
import { deleteFromCloud, generateSignedPdfUrl, uploadToCloud } from "../services/cloudinary.uploader.services.js";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
const createPdfMaterial = asyncWrapper(async (req, res) => {
    const { title, courseId, moduleId } = req.body;
    if (!req.file || !req.file.path) throw new BAD_REQUEST("Please provide PDF file");
    if (!title || !courseId) throw new BAD_REQUEST("Please provide title and course ID");
    if (!moduleId) throw new BAD_REQUEST("pleae provide a valid id");
    const doesCourseExist = await courseModel.findById(courseId);
    if (!doesCourseExist) throw new BAD_REQUEST(`No course found with this id: ${courseId}`);
    const isModuleExist = await courseModuleModel.findOne({ _id: moduleId,moduleCourse:doesCourseExist._id })
    if (!isModuleExist) throw new BAD_REQUEST("no module with this id exist")
    const pdfCourse = courseId;
    const createdBy = req.user.userId;
    const { publicId, secureUrl } = await uploadToCloud(req.file.path, "steammind/documents");
    if (!publicId || !secureUrl) throw new BAD_REQUEST("Unable to upload file to the cloud");
    const newPdf = await pdfMaterialModel.create({
        pdfCourse,
        createdBy,
        title,
        pdfMaterialInfo: {
            secureUrl,
            publicId,
        },
        moduleItBelongTo: isModuleExist
    });
    console.log(newPdf);

    cleanupUploadedFiles(req);

    res.status(201).json({
        success: true,
        message: "PDF material uploaded successfully",
        pdf: newPdf,
    });
});

const updatePdfTitle = asyncWrapper(async (req, res) => {
    const { title } = req.body;
    const { courseId, pdfId } = req.params;
    if (!title || title.trim() === "") {
        throw new BAD_REQUEST("Title is required");
    }
    const course = await courseModel.findById(courseId);
    if (!course || course.isDeleted) {
        throw new NOT_FOUND(`No active course found with this id: ${courseId}`);
    }
    const pdf = await pdfMaterialModel.findOne({ _id: pdfId, pdfCourse: courseId, isDeleted: false });
    if (!pdf) throw new NOT_FOUND("No active PDF material found");

    pdf.title = title.trim();
    await pdf.save();

    res.status(200).json({
        success: true,
        message: "PDF title updated successfully",
        pdf,
    });
});

const getAllPdfs = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const course = await courseModel.findById(courseId);
    if (!course || course.isDeleted)
        throw new NOT_FOUND(`No course found with this id: ${courseId}`);
    const pdfs = await pdfMaterialModel.find({ pdfCourse: courseId, isDeleted: false });
    if (!pdfs || pdfs.length === 0)
        throw new NOT_FOUND("No PDF materials found for this course");

    res.status(200).json({
        success: true,
        message: "All PDF materials",
        total: pdfs.length,
        pdfs,
    });
});


const getSinglePdf = asyncWrapper(async (req, res) => {
    const { courseId, pdfId } = req.params;
    const doesCourseExist = await courseModel.findById(courseId);
    if (!doesCourseExist) throw new NOT_FOUND(`No course found with this id: ${courseId}`);
    const pdf = await pdfMaterialModel.findOne({ _id: pdfId, pdfCourse: courseId });
    if (!pdf) throw new NOT_FOUND("No PDF material found");
    res.status(200).json({
        success: true,
        message: "Single PDF material",
        pdf,
    });
});


const deletePdfMaterial = asyncWrapper(async (req, res) => {
    const { courseId, pdfId } = req.params;
    const adminId = req.user.userId;
    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND(`No course found with id: ${courseId}`);
    const pdf = await pdfMaterialModel.findOne({ _id: pdfId, pdfCourse: courseId, isDeleted: false });
    if (!pdf) throw new NOT_FOUND("No PDF material found");
    pdf.isDeleted = true;
    pdf.deletedAt = new Date();
    pdf.deletedBy = adminId;

    await pdf.save();
    await deletionHistoryModel.create({
        itemId: pdf._id,
        itemName: pdf.title,
        itemModel: "PdfMaterial",
        performedBy: adminId,
        affectedRefs: [],
    });
    res.status(200).json({
        success: true,
        message: "PDF material moved to trash successfully",
        pdf,
    });
});


const restorePdfMaterial = asyncWrapper(async (req, res) => {
    const { pdfId } = req.params;
    const adminId = req.user.userId;
    const history = await deletionHistoryModel.findOne({
        itemId: pdfId,
        itemModel: "PdfMaterial",
    }).sort({ createdAt: -1 });
    if (!history) throw new NOT_FOUND("No deletion history found for this PDF material");
    const pdf = await pdfMaterialModel.findById(pdfId);
    if (!pdf) throw new NOT_FOUND("PDF material not found");
    pdf.isDeleted = false;
    pdf.deletedAt = null;
    pdf.deletedBy = null;
    pdf.restoredAt = new Date();
    pdf.restoredBy = adminId;
    await pdf.save();
    await history.deleteOne();
    res.status(200).json({
        success: true,
        message: "PDF material restored successfully",
        pdf,
    });
});

const deletePdfMaterialPermanently = asyncWrapper(async (req, res) => {
    const { pdfId } = req.params;
    const pdf = await pdfMaterialModel.findOne({ _id: pdfId,  isDeleted: true });
    if (!pdf) throw new NOT_FOUND("PDF material not found");
    await deleteFromCloud(pdf.pdfMaterialInfo.publicId);
    await pdf.deleteOne();
    await deletionHistoryModel.deleteMany({
        itemId: pdfId,
        itemModel: "PdfMaterial",
    });
    res.status(200).json({
        success: true,
        message: "PDF material permanently deleted",
        pdf,
    });
});
const getAllPdfsByModule = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    if (!courseId) {
        throw new BAD_REQUEST("Please provide a courseId");
    }

    const groupedPdfs = await pdfMaterialModel.aggregate([
        {
            $match: {
                pdfCourse: new mongoose.Types.ObjectId(courseId),
                isDeleted: false
            }
        },
        {
            $lookup: {
                from: 'coursemodules',
                localField: 'moduleItBelongTo',
                foreignField: '_id',
                as: 'moduleDetails'
            }
        },
        { $unwind: '$moduleDetails' },
        {
            $group: {
                _id: '$moduleItBelongTo',
                moduleName: { $first: '$moduleDetails.moduleName' },
                moduleIndex: { $first: '$moduleDetails.moduleIndex' },
                materials: {
                    $push: {
                        _id: '$_id',
                        title: '$title',
                        pdfMaterialInfo: '$pdfMaterialInfo',
                        createdAt: '$createdAt'
                    }
                }
            }
        },
        {
            $sort: { moduleIndex: 1 }
        }
    ]);

    if (!groupedPdfs || groupedPdfs.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No PDF materials found for this course",
            data: []
        });
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "PDF materials retrieved and grouped by module",
        data: groupedPdfs,
    });
});

const getPdfsByModule = asyncWrapper(async (req, res) => {
    const { moduleId } = req.params;
    const module = await courseModuleModel.findById(moduleId);
    if (!module) throw new NOT_FOUND(`no module exist with this id: ${moduleId}`);
    const pdfs = await pdfMaterialModel.find({
        moduleItBelongTo: moduleId,
        isDeleted: false
    });

    if (!pdfs || pdfs.length === 0)
        throw new NOT_FOUND("no pdf materials exist for this module");

    res.status(200).json({
        success: true,
        message: `pfd materials for module ${module.title}`,
        data: pdfs,
    });
});
const getAllPdfsStudentSideModuleWise = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const isEnrolled = await enrollmentModel.findOne({
        user: userId,
        course: courseId,
        enrollmentStatus: 'approved',
        isDeleted: false
    });

    if (!isEnrolled) {
        throw new UNAUTHORIZED("You must be enrolled and approved to view course materials.");
    }
    const pdfContent = await courseModuleModel.aggregate([
        {
            $match: {
                moduleCourse: new mongoose.Types.ObjectId(courseId),
                isDeleted: false
            }
        },
        { $sort: { moduleIndex: 1 } },
        {
            $lookup: {
                from: 'pdfmaterials',
                let: { moduleId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$moduleItBelongTo', '$$moduleId'] },
                                    { $eq: ['$isDeleted', false] }
                                ]
                            }
                        }
                    }
                ],
                as: 'materials'
            }
        },
        {
            $project: {
                moduleName: 1,
                materials: {
                    _id: 1,
                    title: 1,
                }
            }
        }
    ]);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'PDF material module wise student side',
        data: pdfContent
    });
});

const getSinglePdfStudentSide = asyncWrapper(async (req, res) => {
    const { pdfId } = req.params;
    const userId = req.user.userId;

    const pdf = await pdfMaterialModel.findOne({ _id: pdfId, isDeleted: false });
    if (!pdf) throw new NOT_FOUND("PDF material not found.");
    const enrollment = await enrollmentModel.findOne({
        user: userId,
        course: pdf.pdfCourse,
        enrollmentStatus: 'approved',
        isDeleted: false
    });

    if (!enrollment) throw new UNAUTHORIZED("Access denied.");
    const signedUrl = generateSignedPdfUrl(pdf.pdfMaterialInfo.publicId);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "PDF access granted",
        data: [{
            title: pdf.title,
            pdfUrl: signedUrl
        }]
    });
});
export { createPdfMaterial, updatePdfTitle, getAllPdfs, getSinglePdf, deletePdfMaterial, deletePdfMaterialPermanently, restorePdfMaterial, getAllPdfsByModule, getPdfsByModule,getAllPdfsStudentSideModuleWise,getSinglePdfStudentSide };
