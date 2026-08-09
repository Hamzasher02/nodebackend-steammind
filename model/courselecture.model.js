import mongo from 'mongoose';

const courseLectureSchema = new mongo.Schema({
    lectureCourse: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: "Staff",
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    resolution: {
        type: String,
        required: true,
    },
    fileSize: {
        type: String,
        required: true,
    },
    lectureInfo: {
        secureUrl: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
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
    moduleItBelongTo: {
        type: mongo.Types.ObjectId,
        ref: 'CourseModule',
        required: true
    }

}, { timestamps: true });

const courseLectureModel = mongo.model('CourseLecture', courseLectureSchema);

export default courseLectureModel;
