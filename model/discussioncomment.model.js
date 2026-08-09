import mongoose from 'mongoose';

const discussionCommentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Types.ObjectId,
        ref: 'DiscussionPost',
        required: [true, 'Post reference is required']
    },
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        minlength: [5, 'Content must be at least 5 characters'],
        maxlength: [2000, 'Content cannot exceed 2000 characters']
    },
    isAccepted: {
        type: Boolean,
        default: false
    },
    likeCount: {
        type: Number,
        default: 0
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
    }
}, { timestamps: true });

// Index for efficient querying
discussionCommentSchema.index({ post: 1, createdAt: -1 });
discussionCommentSchema.index({ author: 1 });

const discussionCommentModel = mongoose.model('DiscussionComment', discussionCommentSchema);

export default discussionCommentModel;
