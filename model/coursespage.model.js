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

const coursesPageSchema = new mongoose.Schema({
    section1: {
        heading: {
            type: String,
            default: '',
            trim: true
        },
        subHeading: {
            type: String,
            default: '',
            trim: true
        },
        backgroundImage: {
            type: imageSchema,
            default: null
        }
    }
}, { timestamps: true });

const coursesPageModel = mongoose.model('CoursesPage', coursesPageSchema);

export default coursesPageModel;

