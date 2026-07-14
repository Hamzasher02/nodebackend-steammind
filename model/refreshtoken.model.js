import mongo from 'mongoose';

const refreshTokenSchema = new mongo.Schema({
    refreshToken: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    isValid: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true,
    }

}, { timestamps: true });

const refreshTokenModel = mongo.model('refreshToken', refreshTokenSchema);

export default refreshTokenModel;
