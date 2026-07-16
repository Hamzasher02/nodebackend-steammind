import fs from "fs";
import { deleteFromCloud, uploadToCloud } from "../services/cloudinary.uploader.services.js";
import { BAD_REQUEST } from "../error/error.js";

function collectUploadedFiles(req) {
    const uploadedFiles = [];

    if (req.file) {
        uploadedFiles.push(req.file);
    }

    if (Array.isArray(req.files)) {
        uploadedFiles.push(...req.files);
    } else if (req.files && typeof req.files === "object") {
        Object.values(req.files).forEach((files) => {
            if (Array.isArray(files)) {
                uploadedFiles.push(...files);
            } else if (files) {
                uploadedFiles.push(files);
            }
        });
    }

    return uploadedFiles.filter((file) => file?.path);
}

function cleanupUploadedFiles(req) {
    collectUploadedFiles(req).forEach((file) => {
        fs.unlink(file.path, (err) => {
            if (err) console.error("error deleting file:", err);
        });
    });
}

/**
 * Uploads a single file to Cloudinary and deletes the old file if successful.
 * Automatically runs local file cleanup on failure.
 */
async function handleCloudinaryUpload(req, file, oldPublicId = null) {
    if (!file) return null;
    try {
        const cloudResult = await uploadToCloud(file.path);
        if (oldPublicId) {
            try {
                await deleteFromCloud(oldPublicId);
            } catch (delErr) {
                console.error("Non-blocking error deleting old asset from Cloudinary:", delErr);
            }
        }
        return cloudResult;
    } catch (err) {
        cleanupUploadedFiles(req);
        throw err;
    }
}

/**
 * Uploads multiple files in sequence to Cloudinary.
 * If any upload fails, it deletes all successfully uploaded files in the current batch from Cloudinary and cleans up local temp files.
 */
async function handleMultipleCloudinaryUploads(req, files) {
    if (!files || files.length === 0) return [];
    const uploadedImages = [];
    try {
        for (const file of files) {
            const cloudResult = await uploadToCloud(file.path);
            uploadedImages.push(cloudResult);
        }
        return uploadedImages;
    } catch (err) {
        for (const img of uploadedImages) {
            await deleteFromCloud(img.publicId);
        }
        cleanupUploadedFiles(req);
        throw err;
    }
}

/**
 * Safely parses stringified form-data JSON fields.
 * On syntax failure, cleans up any uploaded files and throws a BAD_REQUEST error.
 */
function safeJsonParse(req, data, errorMessage = "Invalid JSON format") {
    if (data === undefined || data === null) return data;
    if (typeof data !== "string") return data;
    try {
        return JSON.parse(data);
    } catch (err) {
        cleanupUploadedFiles(req);
        throw new BAD_REQUEST(errorMessage);
    }
}

export { handleCloudinaryUpload, handleMultipleCloudinaryUploads, safeJsonParse };
export default cleanupUploadedFiles;
