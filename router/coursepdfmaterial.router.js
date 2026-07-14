import express from "express";
import authenticationMiddleware from "../middleware/authentication.middleware.js";
import { singlePdfFile } from "../middleware/multer.middleware.js";
import {
    createPdfMaterial,
    updatePdfTitle,
    getAllPdfs,
    getSinglePdf,
    deletePdfMaterial,
    deletePdfMaterialPermanently,
    restorePdfMaterial,
    getAllPdfsByModule,
    getPdfsByModule,
    getAllPdfsStudentSideModuleWise,
    getSinglePdfStudentSide
} from "../controller/coursepdfmaterial.controller.js";
import {
    createPdfValidator,
    updatePdfTitleValidator,
    getAllPdfsValidator,
    getSinglePdfValidator,
    deletePdfValidator
} from "../services/coursepdfmaterial.validator.js";
import { validationMiddleware } from "../services/auth.validator.services.js";
import activityLogger from '../middleware/activitylogger.middleware.js';
import routeAuthorizationMiddleware from "../middleware/route.authorization.middleware.js";

const router = express.Router();

router.post(
    "/uploadCoursePdf",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "write"),
    singlePdfFile,
    createPdfValidator(),
    validationMiddleware,
    activityLogger("PDF_MATERIAL", "Upload course PDF request"),
    createPdfMaterial
);

router.patch(
    "/updatePdfTitle/:courseId/:pdfId",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "update"),
    updatePdfTitleValidator(),
    validationMiddleware,
    activityLogger("PDF_MATERIAL", "Update course PDF title request"),
    updatePdfTitle
);

router.get(
    "/getAllPdfs/:courseId",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    getAllPdfsValidator(),
    validationMiddleware,
    activityLogger("PDF_MATERIAL", "Get all course PDFs request"),
    getAllPdfs
);

router.get(
    "/getSinglePdf/:courseId/:pdfId",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    getSinglePdfValidator(),
    validationMiddleware,
    activityLogger("PDF_MATERIAL", "Get single course PDF request"),
    getSinglePdf
);

router.delete(
    "/deletePdf/:courseId/:pdfId",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "delete"),
    deletePdfValidator(),
    validationMiddleware,
    activityLogger("PDF_MATERIAL", "Delete course PDF request"),
    deletePdfMaterial
);

router.delete(
    "/deletePdfMaterialPermanently/:pdfId",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "delete"),
    deletePdfValidator(),
    validationMiddleware,
    activityLogger("PDF_MATERIAL", "Deleted course PDF permanently"),
    deletePdfMaterialPermanently
);

router.patch(
    "/restorePdfMaterial/:courseId/:pdfId",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "update"),
    deletePdfValidator(),
    validationMiddleware,
    activityLogger("PDF_MATERIAL", "Restored course PDF request"),
    restorePdfMaterial
);

router.get(
    "/getAllPdfsByModule/:courseId",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    activityLogger("PDF_MATERIAL", "Get all PDFs by module request"),
    getAllPdfsByModule
);
router.get(
    "/getAllPdfsStudentSideModuleWise/:courseId",
    authenticationMiddleware,
    activityLogger("PDF_MATERIAL", "Get all PDFs by module request"),
    getAllPdfsStudentSideModuleWise
);
router.get(
    "/getSinglePdfStudentSide/:pdfId",
    authenticationMiddleware,
    activityLogger("PDF_MATERIAL", "Get all PDFs by module request"),
    getSinglePdfStudentSide
);
router.get(
    "/getPdfsByModule/:moduleId",
    authenticationMiddleware,
    routeAuthorizationMiddleware("course management", "read"),
    activityLogger("PDF_MATERIAL", "Get PDFs for specific module request"),
    getPdfsByModule
);

export default router;
