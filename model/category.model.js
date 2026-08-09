import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    categoryDescription: {
        type: String,
        required: true,
    },
    icon: {
        publicId: {
            type: String,
            required: true
        },
        secureUrl: {
            type: String,
            required: true
        }
    },
    subCategory: {
        type: [String],
    },
    categoryLevel: {
        type: [String],

    },
    categoryAgeGroup: {
        type: [String],
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'Staff',
        required: true,
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
        ref: 'Staff',
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongoose.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    visibility:{
        type:String,
        enum:['active','inactive'],
        default:'active'
    }
}, { timestamps: true });

const categoryModel = mongoose.model('Category', categorySchema);

export default categoryModel;
