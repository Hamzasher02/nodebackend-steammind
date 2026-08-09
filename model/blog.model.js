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

const contentBlockSchema = new mongoose.Schema({
    blockType: {
        type: String,
        enum: ['heading', 'subheading', 'list', 'text'],
        required: true
    },
    headingText: {
        type: String,
        trim: true
    },
    listItems: {
        type: [String],
        default: []
    },
    paragraphText: {
        type: String,
        trim: true
    }
});

const blogCardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    platform: {
        type: String,
        trim: true
    },
    stemSkills: {
        type: [String],
        default: []
    },
    paragraph: {
        type: String,
        trim: true
    },
    example: {
        type: String,
        trim: true
    },
    learningOutcomes: {
        type: String,
        trim: true
    },
    proTips: {
        type: String,
        trim: true
    },
    image: {
        type: imageSchema,
        default: null
    }
});

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    urlSlug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    authorName: {
        type: String,
        required: true,
        trim: true
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    },
    featuredImage: {
        type: imageSchema,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    contentBlocks: {
        type: [contentBlockSchema],
        default: []
    },
    cards: {
        type: [blogCardSchema],
        default: []
    }
}, { timestamps: true });

const blogModel = mongoose.model('Blog', blogSchema);

export default blogModel;
