import mongoose from 'mongoose';

const courseModuleSchema = new mongoose.Schema({
    moduleName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 100,
        required: true,
    },
    moduleDescription: {
        type: String,
        trim: true,
        minlength:3,
        maxlength:300,
        default:null
    },
    noOfSession: {
        type: Number,
        default: null
    },
    sessionDuration: {
        type: Number,
        default: null
    },
    completed: {
        type: Boolean,
        default: false
    },
    moduleCourse: {
        type: mongoose.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'Staff',
        required: true,
    },
    moduleIndex: {
        type:Number,
        required: true,
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
        type: mongoose.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongoose.Types.ObjectId,
        ref: 'Staff',
        default: null
    },

}, { timestamps: true });
courseModuleSchema.pre('save', function (next) {
    if (this.noOfSession && this.sessionDuration && this.moduleDescription) {
        this.completed = true;
    } else {
        this.completed = false;
    }
    next();
});

const courseModuleModel = mongoose.model('CourseModule', courseModuleSchema);

export default courseModuleModel;
