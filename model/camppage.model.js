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

const detailSchema = new mongoose.Schema({
    icon: {
        type: imageSchema,
        required: true
    },
    label: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    }
});

const advantageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    }
});

const campPageSchema = new mongoose.Schema({
    pageType: {
        type: String,
        enum: ['summer', 'winter'],
        required: true,
        unique: true
    },
    section1: {
        image: {
            type: imageSchema,
            default: null
        },
        heading: {
            type: String,
            default: '',
            trim: true
        },
        paragraphs: {
            type: [String],
            default: []
        }
    },
    details: {
        type: [detailSchema],
        default: []
    },
    advantages: {
        type: [advantageSchema],
        default: []
    }
}, { timestamps: true });

const campPageModel = mongoose.model('CampPage', campPageSchema);

export default campPageModel;
