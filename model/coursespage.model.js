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

const cmsCourseSchema = new mongoose.Schema({
    thumbnail: {
        type: imageSchema,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    ageGroup: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: String,
        required: true,
        trim: true
    },
    lessons: {
        type: String,
        required: true,
        trim: true
    },
    activities: {
        type: String,
        required: true,
        trim: true
    }
});

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
    },
    courses: {
        type: [cmsCourseSchema],
        default: []
    }
}, { timestamps: true });

const coursesPageModel = mongoose.model('CoursesPage', coursesPageSchema);

export default coursesPageModel;
