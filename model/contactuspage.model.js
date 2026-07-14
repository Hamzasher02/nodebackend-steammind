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

const locationCardSchema = new mongoose.Schema({
    icon: {
        type: imageSchema,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    }
});

const contactUsPageSchema = new mongoose.Schema({
    section1: {
        backgroundImage: {
            type: imageSchema,
            default: null
        },
        heading: {
            type: String,
            default: '',
            trim: true
        },
        paragraph: {
            type: String,
            default: '',
            trim: true
        },
        heading2: {
            type: String,
            default: '',
            trim: true
        },
        paragraph2: {
            type: String,
            default: '',
            trim: true
        }
    },
    locations: {
        type: [locationCardSchema],
        default: []
    }
}, { timestamps: true });

const contactUsPageModel = mongoose.model('ContactUsPage', contactUsPageSchema);

export default contactUsPageModel;
