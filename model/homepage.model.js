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

const eventSchema = new mongoose.Schema({
    image: {
        type: imageSchema,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: String,
        required: true,
        trim: true
    }
});

const brandCardSchema = new mongoose.Schema({
    image: {
        type: imageSchema,
        required: true
    },
    icon: {
        type: imageSchema,
        required: true
    },
    heading: {
        type: String,
        required: true,
        trim: true
    },
    paragraphs: {
        type: [String],
        default: []
    }
});

const homepageSchema = new mongoose.Schema({
    hero: {
        backgroundImages: {
            type: [imageSchema],
            default: []
        },
        title: {
            type: String,
            default: '',
            trim: true
        },
        subtitle: {
            type: String,
            default: '',
            trim: true
        }
    },
    events: {
        type: [eventSchema],
        default: []
    },
    aboutUs: {
        description: {
            type: String,
            default: '',
            trim: true
        }
    },
    brandCards: {
        type: [brandCardSchema],
        default: []
    }
}, { timestamps: true });

const homepageModel = mongoose.model('Homepage', homepageSchema);

export default homepageModel;
