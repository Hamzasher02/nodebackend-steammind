import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    publicId: {
        type: String,
        required: true
    },
    secureUrl: {
        type: String,
        required: true
    }
}, { _id: false });

const logosSchema = new mongoose.Schema({
    headerLogo: {
        type: imageSchema,
        default: null
    },
    footerLogo: {
        type: imageSchema,
        default: null
    }
}, { timestamps: true });

const logosModel = mongoose.model('Logos', logosSchema);

export default logosModel;
