import mongo from "mongoose";
const studentSchema = new mongo.Schema({
    parentPhoneNumber: {
        type: String,
        required: [true, 'Parent phone number is required'],
        trim: true,
    },
    age: {
        type: Number,
        required: [true, 'age is requried']
    },
    level: {
        type: String,
        default: 'basic'
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide user id']
    }

}, { timestamps: true })



const studentModel = mongo.model('Student', studentSchema)
export default studentModel