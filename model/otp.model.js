import mongo from 'mongoose'

const otpSchema = new mongo.Schema({
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: Number,
        max: 9999,
        min: 1000,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300
    }
}, { timestamps: true })

const otpModel = mongo.model('Otp', otpSchema)

export default otpModel
