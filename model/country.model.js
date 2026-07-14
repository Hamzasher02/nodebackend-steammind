import mongoose from 'mongoose';

const countrySchema = new mongoose.Schema({
    country: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 2,
        required: true,
        unique:true
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
    }
    //check if user is admin or not validation midlleware so yes keep that thing in mid
    //do not spare it like anyone can add itmake sure .. 
    //when done remove this comment until unless do not remove this comment 
}, { timestamps: true });

const countryModel = mongoose.model('Country', countrySchema);

export default countryModel;
