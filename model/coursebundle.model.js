import mongo from 'mongoose';
const courseBundleSchema = new mongo.Schema({
    thumbnail: {
        type: String,
        required: false
    },
    bundleName: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongo.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCateogory: [{
        type: String,
    }],
    ageGroup: {
        type: String,
    },
    level: [{
        type: String,

    }],
    access: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    priceAfterDiscount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    couponCode: {
        type: String,
        required: false
    },

    visibility: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    courses: [{
        type: mongo.Types.ObjectId,
        ref: 'Course',
    },],
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
        ref: 'Staff',
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
}, { timestamps: true });
courseBundleSchema.pre('save', function (next) {
    if (this.discount && this.price) {
        this.priceAfterDiscount = this.price - (this.price * (this.discount / 100));
    } else {
        this.priceAfterDiscount = this.price;
    }
    next();
});

const courseBundleModel = mongo.model('CoursesBundle', courseBundleSchema);

export default courseBundleModel;
