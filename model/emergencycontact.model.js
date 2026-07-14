import  mongo from 'mongoose';

const emergencyInformationSchema = new mongo.Schema({
    fullName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 50,
        required: true,
    },
    relationship: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
        required: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 25,
        required: true,
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true,
        unique:true
    },
}, { timestamps: true });

const emergencyInformationModel = mongo.model(
    'EmergencyInformation',
    emergencyInformationSchema
);

export default emergencyInformationModel;
