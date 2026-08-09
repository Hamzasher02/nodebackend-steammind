import mongo from 'mongoose'

const courseSchema = new mongo.Schema({
    courseTitle: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 100,
        trim: true,
        unique:true
    },
    courseEnrollementType: {
        type: String,
        enum:["live",'recorded'],
        required: true,
    },
    courseCategory: {
        type: [String],
        required: true,
    },
    courseVisibility: {
        type: Boolean,
        default: false
    },
    isCoursePublished: {
        type: Boolean,
        default: false
    },
    courseThumbnail: {
        publicId: {
            type: String,
            required: true
        },
        secureUrl: {
            type: String,
            required: true
        }
    },
    courseOutline: {
        publicId: {
            type: String,
            required: true
        },
        secureUrl: {
            type: String,
            required: true
        }
    },
    courseSubCategory: {
        type: String,
        required: true,
        trim: true,
    },
    courseAgeGroup: {
        type: String,
        required: true,
        trim: true,
    },
    courseLevel: {
        type: String,
        required: true,
        trim: true,
    },
    courseAccess: {
        type: String,
        default: null
    },
    coursePrice: {
        type: String,
        required: true
    },
    courseOverview: {
        courseDescription: {
            type: String,
            default: null
        },
        courseDuration: {
            type: String,
            default: null
        },
        coursePrerequisite: {
            type: String,
            default: null
        },
        courseTargetAudience: {
            type: String,
            default: null
        }
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    assignedInstructors: [{
        instructor: {
            type: mongo.Types.ObjectId,
            ref: 'User',
            required: true
        },
        assignedBy: {
            type: mongo.Types.ObjectId,
            ref: 'Staff',
            required: true
        },
        assignedAt: {
            type: Date,
            default: Date.now
        }
    }],
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

}, { timestamps: true })

const courseModel = mongo.model("Course", courseSchema)

export default courseModel

