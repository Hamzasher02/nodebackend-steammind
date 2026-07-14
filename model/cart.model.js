import mongo from 'mongoose';

const cartItemSchema = new mongo.Schema({
    course: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    purchaseType: {
        type: String,
        enum: ['Live Classes', 'Recorded Lectures'],
        default: 'Live Classes'
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    courseTitle: {
        type: String,
        required: true,
        trim: true
    },
    courseThumbnail: {
        publicId: {
            type: String,
            default: null
        },
        secureUrl: {
            type: String,
            default: null
        }
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const cartSchema = new mongo.Schema({
    user: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalItems: {
        type: Number,
        default: 0
    },
    totalAmount: {
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
        type: mongo.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

cartSchema.index({ 'items.course': 1 });

const cartModel = mongo.model('Cart', cartSchema);

export default cartModel;
