import mongoose from 'mongoose';

const discussionLikeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    post: {
        type: mongoose.Types.ObjectId,
        ref: 'DiscussionPost',
        default: null
    },
    comment: {
        type: mongoose.Types.ObjectId,
        ref: 'DiscussionComment',
        default: null
    }
}, { timestamps: true });

// Compound indexes to prevent duplicate likes
discussionLikeSchema.index({ user: 1, post: 1 }, { unique: true, sparse: true });
discussionLikeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });

const discussionLikeModel = mongoose.model('DiscussionLike', discussionLikeSchema);

export default discussionLikeModel;
