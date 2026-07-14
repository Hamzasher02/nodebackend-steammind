import mongoose from 'mongoose';

const discussionPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Discussion title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Discussion description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    attachments: [{
        publicId: {
            type: String,
            required: true
        },
        secureUrl: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            enum: ['image', 'file'],
            default: 'file'
        }
    }],
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'answered'],
        default: 'pending'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

// Index for efficient querying
discussionPostSchema.index({ categoryId: 1, createdAt: -1 });
discussionPostSchema.index({ author: 1 });
discussionPostSchema.index({ title: 'text', description: 'text' });

const discussionPostModel = mongoose.model('DiscussionPost', discussionPostSchema);

export default discussionPostModel;
