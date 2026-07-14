import mongo from 'mongoose';

const courseFeedbackSchema = new mongo.Schema({
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
    feedbackText: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 2000
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
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
}, { timestamps: true });

// Prevent duplicate feedback from same user for same course
courseFeedbackSchema.index({ user: 1, course: 1 }, { unique: true });

const courseFeedbackModel = mongo.model('CourseFeedback', courseFeedbackSchema);

export default courseFeedbackModel;
