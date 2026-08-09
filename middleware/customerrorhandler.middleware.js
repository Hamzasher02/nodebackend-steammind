
import { CustomError } from '../error/error.js'
import { StatusCodes } from 'http-status-codes'
import cleanupUploadedFiles from '../utils/cleanup.helper.utils.js';

function customErrorHandler(err, req, res, next) {
    cleanupUploadedFiles(req); // prevent server from being polluted with uploaded junk on errors

    if (err instanceof CustomError) {
        return res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message,
            data: [{}]
        });
    }

    // JWT Error handling
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: `Authentication error: ${err.message}`,
            data: [{}]
        });
    }


    // Mongoose ValidationError — missing required fields, enum violations, etc.
    if (err.name === 'ValidationError') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: err.message,
            data: [{}]
        });
    }

    // MongoDB duplicate key error
    if (err.errorResponse?.code === 11000 || err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(StatusCodes.CONFLICT).json({
            success: false,
            message: `Duplicate value: ${field} already exists`,
            data: [{}]
        });
    }

    // Mongoose CastError — invalid ObjectId format
    if (err.name === 'CastError') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid ID format',
            data: [{}]
        });
    }

    // Catch-all — internal server error (not 404)
    console.error('Unhandled error:', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Internal server error',
        data: [{}]
    });
}

export default customErrorHandler;