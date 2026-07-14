import mongo from 'mongoose'

const quizAnswerSchema = new mongo.Schema({
    quizAttempt: {
        type: mongo.Types.ObjectId,
        ref: 'QuizAttempt',
        required: true
    },
    quiz: {
        type: mongo.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    question: {
        type: mongo.Types.ObjectId,
        ref: 'QuizQuestion',
        required: true
    },
    student: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true
    },
    selectedAnswer: {
        type: String, // for multiple choice, store the selected text
        default: null
    },
    selectedOption: {
        type: String, // store option label (A, B, C, D)
        default: null
    },
    isCorrect: {
        type: Boolean,
        default: false
    },
    pointsObtained: {
        type: Number,
        default: 0
    },
    maxPoints: {
        type: Number,
        required: true
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0
    },
    skipped: {
        type: Boolean,
        default: false
    },
    explanation: {
        type: String,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const quizAnswerModel = mongo.model('QuizAnswer', quizAnswerSchema);
export default quizAnswerModel
