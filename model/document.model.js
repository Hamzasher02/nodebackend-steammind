import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    file: {
        secureUrl: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const documentModel = mongoose.model('Document', documentSchema);

export default documentModel;
