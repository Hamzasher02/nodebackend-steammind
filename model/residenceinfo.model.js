import mongo from 'mongoose';

const residenceInformationSchema = new mongo.Schema({
    address: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 50,
        required: true,
    },
    city: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
        required: true,
    },
    country: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 10,
        required: true,
    },
    postalCode: {
        type: Number,
        min: 100,
        max: 999999999,
        required: true,
    },
    timezone: {
        type: String,
        required: true,
        //decide according to location add yourself
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true,
        unique:true
    },
}, { timestamps: true });

const residenceInformationModel = mongo.model('ResidenceInformation', residenceInformationSchema);

export default residenceInformationModel;
