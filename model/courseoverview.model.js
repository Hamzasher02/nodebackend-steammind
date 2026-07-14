import mongo from 'mongoose';

const courseOverviewSchema = new mongo.Schema({
    courseDescription: {
        type: String,
        default: null
    },
    courseDuration: {
        type: String,
        default: null
    },
    coursePrerequisite: {
        type: String,
        default: null
    },
    courseTargetAudience: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true
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
}, { timestamps: true });

const courseOverviewModel = mongo.model('CourseOverview', courseOverviewSchema);

export default courseOverviewModel;
