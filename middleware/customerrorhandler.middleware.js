
import { CustomError } from '../error/error.js'
import { StatusCodes } from 'http-status-codes'
import cleanupUploadedFiles from '../utils/cleanup.helper.utils.js';
function customErrorHandler(err, req, res, next) {
    cleanupUploadedFiles(req)//incase of any file so server doesnot get polluted with junk ...
    if (err instanceof CustomError) {
        res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message,
            data: [{}]
        });
        return;
    }

    if (err.errorResponse?.code === 11000) {
        res.status(500).json({
            success: false,
            message: "Duplicate value error",
            data: [{}]
        })
        return;
    }

    if (err.name === "CastError") {
        res.status(500).json({
            success: false,
            message: "CastError",
            data: [{}]
        })
        return;
    }
    res.status(404).json({
        success: false,
        message: err.message || String(err),
        data: [{}]
    })


}

export default customErrorHandler