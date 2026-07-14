import mongo from 'mongoose'

const quizAttemptSchema = new mongo.Schema({
    quiz: {
        type: mongo.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    student: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enrollment: {
        type: mongo.Types.ObjectId,
        ref: 'Enrollment',
        required: true
    },
    course: {
        type: mongo.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['in_progress', 'submitted', 'graded'],
        default: 'in_progress'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    submittedAt: {
        type: Date,
        default: null
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0
    },
    score: {
        type: Number,
        default: null
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: null
    },
    isPassed: {
        type: Boolean,
        default: null
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    incorrectAnswers: {
        type: Number,
        default: 0
    },
    skippedQuestions: {
        type: Number,
        default: 0
    },
    review: {
        type: Boolean,
        default: false
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const quizAttemptModel = mongo.model('QuizAttempt', quizAttemptSchema);
export default quizAttemptModel
