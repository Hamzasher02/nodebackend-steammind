import mongoose from 'mongoose';

const studentModuleProgressSchema = new mongoose.Schema({
    enrollment: {
        type: mongoose.Types.ObjectId,
        ref: 'Enrollment',
        required: true
    },
    student: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    module: {
        type: mongoose.Types.ObjectId,
        ref: 'CourseModule',
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    },
    completedBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        default: null,
        validate: {
            validator: async function (v) {
                if (!v) return true;
                const user = await mongoose.model('User').findById(v);
                return user && user.role === 'instructor';
            },
            message: 'Completed by must be an instructor'
        }
    },
    notes: {
        type: String,
        default: null,
        trim: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Unique index: one progress record per student per module per enrollment
studentModuleProgressSchema.index({ enrollment: 1, student: 1, module: 1 }, { unique: true });
studentModuleProgressSchema.index({ student: 1, course: 1 });
studentModuleProgressSchema.index({ completedBy: 1 });

const StudentModuleProgressModel = mongoose.model('StudentModuleProgress', studentModuleProgressSchema);

export default StudentModuleProgressModel;
