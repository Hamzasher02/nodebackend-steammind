import mongo from 'mongoose';

const pdfMaterialSchema = new mongo.Schema({
    title: {
        type: String,
        required: true
    },
    pdfCourse: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: "Staff",
        required: true
    },
    pdfMaterialInfo: {
        secureUrl: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
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
    moduleItBelongTo:{
        type:mongo.Types.ObjectId,
        ref:'CourseModule',
        required:true
    }
}, { timestamps: true });

const pdfMaterialModel = mongo.model('PdfMaterial', pdfMaterialSchema);

export default pdfMaterialModel;
