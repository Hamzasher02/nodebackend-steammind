import mongo from 'mongoose'

const quizQuestionSchema = new mongo.Schema({
    quiz: {
        type: mongo.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    type: {
        type: String,
        enum: ['multipleChoice', 'trueFalse', 'shortAnswer'],
        required: true
    },
    prompt: {
        type: String,
        required: true,
        trim: true,
        minlength: 5
    },
    options: [
        {
            label: String,
            text: String,
            isCorrect: {
                type: Boolean,
                default: false
            }
        }
    ],
    correctAnswers: {
        type: [String],
        default: []
    },
    points: {
        type: Number,
        required: true,
        min: 1,
        max: 1000
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    tags: {
        type: [String],
        default: []
    },
    explanation: {
        type: String,
        trim: true,
        default: ''
    },
    order: {
        type: Number,
        required: true
    },
    source: {
        type: String,
        trim: true,
        default: ''
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

const quizQuestionModel = mongo.model('QuizQuestion', quizQuestionSchema);
export default quizQuestionModel
