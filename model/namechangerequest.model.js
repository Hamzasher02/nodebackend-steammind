import mongo from 'mongoose';

const nameChangeRequestSchema = new mongo.Schema({
    isApproved: {
        type: Boolean,
        default: false,
    },
    firstName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
        required: true
    },
    reasonForCorrection: {
        type: String,
        trim: true,
        minlength: 10,
        maxlength: 100,
        required: true
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
}, { timestamps: true });

const nameChangeRequestModel = mongo.model('NameChangeRequest', nameChangeRequestSchema);

export default nameChangeRequestModel;
