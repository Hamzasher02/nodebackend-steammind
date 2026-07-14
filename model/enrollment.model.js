import mongo from 'mongoose';

const enrollmentSchema = new mongo.Schema({
    user: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrollmentType: {
        type: String,
        enum: ['Live Classes', 'Recorded Lectures'],
        required: true
    },
    preferredClassTime: {
        type: String,
        default: null,
        trim: true
    },
    paymentScreenshot: {
        publicId: {
            type: String,
            required: true
        },
        secureUrl: {
            type: String,
            required: true
        }
    },
    invoiceNumber: {
        type: String,
        default: null,
        trim: true
    },
    enrollmentStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectReason: {
        type: String,
        trim: true,
        default: null
    },
    approvedBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    rejectedBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    isSessionAssigned: {
        type: Boolean,
        required:true,
        default: false
    }
}, { timestamps: true });

// Prevent duplicate enrollments for the same user and course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

const enrollmentModel = mongo.model('Enrollment', enrollmentSchema);

export default enrollmentModel;
