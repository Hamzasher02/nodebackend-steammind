import mongoose from 'mongoose';

const competitionRegistrationSchema = new mongoose.Schema({
    competitionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competition',
        required: true
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    grade: {
        type: String,
        required: true,
        trim: true
    },
    teamName: {
        type: String,
        required: true,
        trim: true
    },
    teamSize: {
        type: Number,
        required: true,
        min: 1
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['confirmed', 'pending', 'canceled'],
        default: 'pending'
    }
}, { timestamps: true });

const competitionRegistrationModel = mongoose.model('CompetitionRegistration', competitionRegistrationSchema);

export default competitionRegistrationModel;
