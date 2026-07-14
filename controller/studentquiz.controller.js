import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import quizModel from "../model/quiz.model.js";
import quizQuestionModel from "../model/quizquestion.model.js";
import quizAttemptModel from "../model/quizattempt.model.js";
import quizAnswerModel from "../model/quizanswer.model.js";
import enrollmentModel from "../model/enrollment.model.js";
import courseModel from "../model/course.model.js";
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from "../error/error.js";

// Get available quizzes for enrolled courses
const getAvailableQuizzes = asyncWrapper(async (req, res) => {
    const studentId = req.user.userId;
    const { courseId, page = 1, limit = 10 } = req.query;

    // Get student's enrollments
    let enrollmentFilter = { user: studentId, isDeleted: false };
    if (courseId) enrollmentFilter.course = courseId;

    const enrollments = await enrollmentModel.find(enrollmentFilter).select('course');
    const courseIds = enrollments.map(e => e.course);

    if (courseIds.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No enrolled courses found",
            data: [],
            pagination: { page, limit, total: 0, pages: 0 }
        });
    }

    // Get published or scheduled quizzes for enrolled courses (not draft)
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const quizzes = await quizModel
        .find({
            course: { $in: courseIds },
            status: { $in: ['published', 'scheduled'] },
            isDeleted: false
        })
        .populate('course', 'courseTitle')
        .populate('module', 'moduleTitle')
        .select('_id title description course module totalPoints totalQuestions category settings createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await quizModel.countDocuments({
        course: { $in: courseIds },
        status: { $in: ['published', 'scheduled'] },
        isDeleted: false
    });

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Available quizzes retrieved successfully",
        data: quizzes,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// Start quiz attempt
const startQuizAttempt = asyncWrapper(async (req, res) => {
    const { quizId } = req.params;
    const studentId = req.user.userId;

    // Verify quiz exists and is published
    const quiz = await quizModel.findById(quizId);
    if (!quiz) throw new NOT_FOUND("Quiz not found");
    if (quiz.isDeleted) throw new NOT_FOUND("Quiz has been deleted");
    if (quiz.status !== 'published') throw new BAD_REQUEST("Quiz is not published");

    // Verify student is enrolled in the course
    const enrollment = await enrollmentModel.findOne({
        user: studentId,
        course: quiz.course,
        isDeleted: false
    });
    if (!enrollment) throw new UNAUTHORIZED("You are not enrolled in this course");

    // Check attempts limit
    const attemptCount = await quizAttemptModel.countDocuments({
        quiz: quizId,
        student: studentId,
        status: { $in: ['submitted', 'graded'] }
    });

    if (attemptCount >= quiz.settings.attemptsAllowed) {
        throw new BAD_REQUEST(`Maximum attempts (${quiz.settings.attemptsAllowed}) reached for this quiz`);
    }

    // Check for existing in-progress attempt
    const existingAttempt = await quizAttemptModel.findOne({
        quiz: quizId,
        student: studentId,
        status: 'in_progress'
    });

    if (existingAttempt) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Resume existing quiz attempt",
            data: existingAttempt
        });
    }

    // Get quiz questions
    const questions = await quizQuestionModel.find({
        quiz: quizId,
        isDeleted: false
    }).select('_id type prompt options points difficulty');

    if (questions.length === 0) {
        throw new BAD_REQUEST("This quiz has no questions");
    }

    // Create new attempt
    const attempt = await quizAttemptModel.create({
        quiz: quizId,
        student: studentId,
        enrollment: enrollment._id,
        course: quiz.course,
        totalQuestions: questions.length,
        totalPoints: quiz.totalPoints,
        status: 'in_progress'
    });

    return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Quiz attempt started",
        data: {
            attemptId: attempt._id,
            quiz: {
                _id: quiz._id,
                title: quiz.title,
                totalQuestions: questions.length,
                totalPoints: quiz.totalPoints,
                settings: quiz.settings
            },
            questions: questions
        }
    });
});

// REMOVED - Now handled in submitQuiz (all answers submitted at once)

// Submit entire quiz with all answers at once
const submitQuiz = asyncWrapper(async (req, res) => {
    const { attemptId } = req.params;
    const { answers: answersData } = req.body;
    const studentId = req.user.userId;

    // Verify attempt
    const attempt = await quizAttemptModel.findById(attemptId);
    if (!attempt) throw new NOT_FOUND("Attempt not found");
    if (attempt.student.toString() !== studentId) throw new UNAUTHORIZED("Not your attempt");
    if (attempt.status !== 'in_progress') throw new BAD_REQUEST("Quiz is not in progress");

    if (!answersData || !Array.isArray(answersData) || answersData.length === 0) {
        throw new BAD_REQUEST("Answers array is required and cannot be empty");
    }

    // Get all questions for the quiz
    const allQuestions = await quizQuestionModel.find({
        quiz: attempt.quiz,
        isDeleted: false
    });

    // Process each answer
    const createdAnswers = [];
    for (const answerData of answersData) {
        const { questionId, selectedAnswer, selectedOption, timeSpent, skipped } = answerData;

        // Find question
        const question = allQuestions.find(q => q._id.toString() === questionId.toString());
        if (!question) throw new NOT_FOUND(`Question ${questionId} not found`);

        let isCorrect = false;
        let pointsObtained = 0;

        if (!skipped && selectedAnswer) {
            // Check if answer is correct
            isCorrect = question.correctAnswers.some(correct =>
                correct.toLowerCase() === selectedAnswer.toLowerCase()
            );
            pointsObtained = isCorrect ? question.points : 0;
        }

        // Create answer record
        const answer = await quizAnswerModel.create({
            quizAttempt: attemptId,
            quiz: attempt.quiz,
            question: questionId,
            student: studentId,
            selectedAnswer: selectedAnswer || null,
            selectedOption: selectedOption || null,
            isCorrect,
            pointsObtained,
            maxPoints: question.points,
            timeSpent: timeSpent || 0,
            skipped: skipped || false,
            explanation: question.explanation
        });

        createdAnswers.push(answer);
    }

    // Calculate score
    const correctAnswers = createdAnswers.filter(a => a.isCorrect).length;
    const totalScore = createdAnswers.reduce((sum, a) => sum + a.pointsObtained, 0);
    const percentage = attempt.totalPoints > 0 ? (totalScore / attempt.totalPoints) * 100 : 0;

    // Get quiz to check passing score
    const quiz = await quizModel.findById(attempt.quiz);
    const isPassed = percentage >= quiz.settings.passingScorePercent;

    // Update attempt
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.score = totalScore;
    attempt.percentage = Math.round(percentage);
    attempt.isPassed = isPassed;
    attempt.correctAnswers = correctAnswers;
    attempt.incorrectAnswers = createdAnswers.filter(a => !a.isCorrect && !a.skipped).length;
    attempt.skippedQuestions = createdAnswers.filter(a => a.skipped).length;
    attempt.timeSpent = createdAnswers.reduce((sum, a) => sum + a.timeSpent, 0);
    await attempt.save();

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Quiz submitted successfully",
        data: {
            attemptId: attempt._id,
            score: totalScore,
            totalPoints: attempt.totalPoints,
            percentage: attempt.percentage,
            isPassed,
            correctAnswers,
            incorrectAnswers: attempt.incorrectAnswers,
            skippedQuestions: attempt.skippedQuestions
        }
    });
});

// Get quiz results
const getQuizResults = asyncWrapper(async (req, res) => {
    const { attemptId } = req.params;
    const studentId = req.user.userId;

    const attempt = await quizAttemptModel
        .findOne({ _id: attemptId, student: studentId })
        .populate('quiz', 'title')
        .populate('course', 'courseTitle');

    if (!attempt) throw new NOT_FOUND("Attempt not found");

    // Get all answers with question details
    const answers = await quizAnswerModel.aggregate([
        { $match: { quizAttempt: attempt._id } },
        {
            $lookup: {
                from: 'quizquestions',
                localField: 'question',
                foreignField: '_id',
                as: 'questionDetails'
            }
        },
        { $unwind: '$questionDetails' },
        {
            $project: {
                question: '$questionDetails._id',
                prompt: '$questionDetails.prompt',
                options: '$questionDetails.options',
                selectedAnswer: 1,
                selectedOption: 1,
                isCorrect: 1,
                pointsObtained: 1,
                maxPoints: 1,
                explanation: 1,
                skipped: 1,
                correctAnswers: '$questionDetails.correctAnswers'
            }
        }
    ]);

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Quiz results retrieved",
        data: {
            attemptId: attempt._id,
            quiz: attempt.quiz,
            course: attempt.course,
            score: attempt.score,
            totalPoints: attempt.totalPoints,
            percentage: attempt.percentage,
            isPassed: attempt.isPassed,
            status: attempt.status,
            submittedAt: attempt.submittedAt,
            stats: {
                totalQuestions: attempt.totalQuestions,
                correctAnswers: attempt.correctAnswers,
                incorrectAnswers: attempt.incorrectAnswers,
                skippedQuestions: attempt.skippedQuestions
            },
            answers
        }
    });
});

// Get quiz attempt history
const getQuizAttempts = asyncWrapper(async (req, res) => {
    const studentId = req.user.userId;
    const { quizId, page = 1, limit = 10 } = req.query;

    let filter = { student: studentId, isDeleted: false };
    if (quizId) filter.quiz = quizId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attempts = await quizAttemptModel
        .find(filter)
        .populate('quiz', 'title')
        .populate('course', 'courseTitle')
        .select('_id quiz course score totalPoints percentage isPassed status submittedAt createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await quizAttemptModel.countDocuments(filter);

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Quiz attempts retrieved",
        data: attempts,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

export {
    getAvailableQuizzes,
    startQuizAttempt,
    submitQuiz,
    getQuizResults,
    getQuizAttempts
};
