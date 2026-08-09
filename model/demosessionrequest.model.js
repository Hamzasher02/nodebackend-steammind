import mongo from "mongoose";

const demoSessionRequestSchema = new mongo.Schema({
    studentId: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student ID is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    subcategory: {
        type: String,
        required: [true, 'Subcategory is required'],
        trim: true
    },
    courseId: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    preferredDate: {
        type: Date,
        required: [true, 'Preferred date is required']
    },
    preferredTime: {
        type: String,
        required: [true, 'Preferred time is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectReason: {
        type: String,
        trim: true,
        default: null
    },
    instructorId: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        default: null
    },
    demoSessionLink: {
        type: String,
        trim: true,
        default: null
    },
    approvedDate: {
        type: Date,
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
    }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Compound index to prevent duplicate active requests for same student and course
// This ensures one student can only have one pending/approved request per course
demoSessionRequestSchema.index(
    { studentId: 1, courseId: 1, status: 1 },
    { 
        unique: false, // Not unique because we allow rejected requests to be re-requested
        partialFilterExpression: { 
            status: { $in: ['pending', 'approved'] },
            isDeleted: false 
        }
    }
);

demoSessionRequestSchema.virtual("student", {
    ref: "User",
    localField: "studentId",
    foreignField: "_id",
    justOne: true,
    options: {
        select: "firstName lastName email phoneNumber profilePicture"
    }
});

demoSessionRequestSchema.virtual("course", {
    ref: "Course",
    localField: "courseId",
    foreignField: "_id",
    justOne: true
});

demoSessionRequestSchema.virtual("instructor", {
    ref: "User",
    localField: "instructorId",
    foreignField: "_id",
    justOne: true,
    options: {
        select: "firstName lastName email phoneNumber profilePicture"
    }
});

const demoSessionRequestModel = mongo.model('DemoSessionRequest', demoSessionRequestSchema);

export default demoSessionRequestModel;
