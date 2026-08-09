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

const sectionBlockSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        trim: true
    },
    paragraphs: {
        type: [String],
        default: []
    },
    blockType: {
        type: String,
        enum: ['text', 'bullet', 'numbered'],
        default: 'text'
    }
});

const productSectionSchema = new mongoose.Schema({
    image: {
        type: imageSchema,
        required: true
    },
    heading: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    blocks: {
        type: [sectionBlockSchema],
        default: []
    }
});

const productsPageSchema = new mongoose.Schema({
    hero: {
        backgroundImage: {
            type: imageSchema,
            default: null
        },
        heading: {
            type: String,
            default: '',
            trim: true
        },
        subHeading: {
            type: String,
            default: '',
            trim: true
        }
    },
    sections: {
        type: [productSectionSchema],
        default: []
    }
}, { timestamps: true });

const productsPageModel = mongoose.model('ProductsPage', productsPageSchema);

export default productsPageModel;
