import mongo from 'mongoose';

const courseSessionSchema = new mongo.Schema({
    course: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true // yeh b nh honi chaiya jb enrolemnet hy toh aus main course ki hy jo
    },
    enrollment: {
        type: mongo.Types.ObjectId,
        ref: 'Enrollment',
        required: true
    },
    instructor: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: async function (v) {
                // Instructor must have instructor role
                const user = await mongo.model('User').findById(v);
                return user && user.role === 'instructor';
            },
            message: 'Selected instructor must have instructor role'
        }
    },
    student: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true//yeh b nh honi chaiya bhaiiiiiiiiiii jb enrolment hy toh aus sy nikal lo na q save krwa rehy extra

    },
    sessionDate: {
        type: String,
        required: true,
        trim: true
    },
    startTime: {
        type: String,
        required: true,
        trim: true
    },
    endTime: {
        type: String,
        required: true,
        trim: true
    },
    sessionLink: {
        type: String,
        default: null,
        trim: true
    },

    sessionStatus: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true// yeh b extra hy next main ais ko b dekhain gy
    },
    notes: {
        type: String,
        default: null,
        trim: true
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
    },//yeh b mjy ghalt lag raha yaha staff hona chaiya lets see bde main krna ais ko b
    
}, {
    timestamps: true
});

// Index for quick lookups
courseSessionSchema.index({ enrollment: 1, course: 1 });
courseSessionSchema.index({ instructor: 1 });
courseSessionSchema.index({ student: 1 });
courseSessionSchema.index({ sessionDate: 1, startTime: 1 });
courseSessionSchema.index({ isDeleted: 1 });

const CourseSessionModel = mongo.model('CourseSession', courseSessionSchema);

export default CourseSessionModel;
