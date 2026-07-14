import mongo from 'mongoose'

const quizSchema = new mongo.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200
    },
    course: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    module: {
        type: mongo.Types.ObjectId,
        ref: 'CourseModule',
        default: null
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    category: {
        type: String,
        enum: ['Assessment', 'Practice', 'Placement', 'Pre-Assessment'],
        default: 'Assessment'
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'scheduled'],
        default: 'draft'
    },
    publishAt: {
        type: Date,
        default: null
    },
    settings: {
        timeLimitMinutes: {
            type: Number,
            default: 0
        },
        attemptsAllowed: {
            type: Number,
            default: 1,
            min: 1
        },
        passingScorePercent: {
            type: Number,
            default: 70,
            min: 0,
            max: 100
        },
        randomizeQuestions: {
            type: Boolean,
            default: false
        },
        allowBackNavigation: {
            type: Boolean,
            default: true
        },
        showProgressBar: {
            type: Boolean,
            default: true
        },
        showResults: {
            type: String,
            enum: ['immediately', 'later'],
            default: 'immediately'
        }
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true
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
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

const quizModel = mongo.model('Quiz', quizSchema);
export default quizModel
