import mongo from 'mongoose';

const courseLearningOutcomeSchema = new mongo.Schema({
    outcomeDescription: {
        type: String,
        required:true,
    },
    belongTo: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
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

const courseLearningOutcomeModel = mongo.model('courseOverview', courseLearningOutcomeSchema);

export default courseLearningOutcomeModel;
