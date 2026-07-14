import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import quizModel from "../model/quiz.model.js";
import quizQuestionModel from "../model/quizquestion.model.js";
import quizAttemptModel from "../model/quizattempt.model.js";
import courseModel from "../model/course.model.js";
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from "../error/error.js";

const createQuiz = asyncWrapper(async (req, res) => {
    const { title, course, module, description, category } = req.body;
    const userId = req.user.userId;

    // Validate course exists
    const courseDoc = await courseModel.findById(course);
    if (!courseDoc) throw new NOT_FOUND("Course not found");

    // Create quiz in draft status
    const quiz = await quizModel.create({
        title: title.trim(),
        course,
        module: module || null,
        description: description ? description.trim() : '',
        category: category || 'Assessment',
        createdBy: userId
    });

    return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Quiz created successfully",
        data: quiz
    });
});

const updateQuizInfo = asyncWrapper(async (req, res) => {
    const { quizId } = req.params;
    const { title, description, category, module } = req.body;
    const userId = req.user.userId;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) throw new NOT_FOUND("Quiz not found");
    if (quiz.isDeleted) throw new NOT_FOUND("Quiz has been deleted");
    if (quiz.createdBy.toString() !== userId) throw new UNAUTHORIZED("You can only edit your own quizzes");

    // Allow editing only in draft or scheduled status
    if (!['draft', 'scheduled'].includes(quiz.status)) {
        throw new BAD_REQUEST("Cannot edit quiz in published status");
    }

    if (title) quiz.title = title.trim();
    if (description !== undefined) quiz.description = description.trim();
    if (category) quiz.category = category;
    if (module !== undefined) quiz.module = module || null;

    await quiz.save();

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Quiz information updated",
        data: quiz
    });
});

const addQuestion = asyncWrapper(async (req, res) => {
    const { quizId } = req.params;
    const { type, prompt, options, correctAnswers, points, difficulty, explanation, tags, source } = req.body;
    const userId = req.user.userId;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) throw new NOT_FOUND("Quiz not found");
    if (quiz.isDeleted) throw new NOT_FOUND("Quiz has been deleted");
    if (quiz.createdBy.toString() !== userId) throw new UNAUTHORIZED("You can only edit your own quizzes");

    // Can only add questions to draft/scheduled quizzes
    if (!['draft', 'scheduled'].includes(quiz.status)) {
        throw new BAD_REQUEST("Cannot add questions to published quiz");
    }

    // Only allow Multiple Choice questions
    if (type !== 'multipleChoice') {
        throw new BAD_REQUEST("Only multiple choice questions are supported");
    }

    // Get next order number
    const lastQuestion = await quizQuestionModel.findOne({ quiz: quizId, isDeleted: false }).sort({ order: -1 });
    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 1;

    // Create question
    const question = await quizQuestionModel.create({
        quiz: quizId,
        type: 'multipleChoice',
        prompt: prompt.trim(),
        options: options || [],
        correctAnswers: correctAnswers || [],
        points,
        difficulty: difficulty || 'medium',
        explanation: explanation ? explanation.trim() : '',
        tags: tags || [],
        source: source ? source.trim() : '',
        order: nextOrder
    });

    // Update quiz totals
    quiz.totalPoints += points;
    quiz.totalQuestions += 1;
    await quiz.save();

    return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Question added successfully",
        data: question
    });
});

const updateQuestion = asyncWrapper(async (req, res) => {
    const { quizId, questionId } = req.params;
    const { type, prompt, options, correctAnswers, points, difficulty, explanation, tags, source } = req.body;
    const userId = req.user.userId;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) throw new NOT_FOUND("Quiz not found");
    if (quiz.createdBy.toString() !== userId) throw new UNAUTHORIZED("You can only edit your own quizzes");

    const question = await quizQuestionModel.findOne({ _id: questionId, quiz: quizId, isDeleted: false });
    if (!question) throw new NOT_FOUND("Question not found");

    // Can only update questions in draft/scheduled quizzes
    if (!['draft', 'scheduled'].includes(quiz.status)) {
        throw new BAD_REQUEST("Cannot edit questions in published quiz");
    }

    const oldPoints = question.points;

    if (type) question.type = type;
    if (prompt) question.prompt = prompt.trim();
    if (options) question.options = options;
    if (correctAnswers) question.correctAnswers = correctAnswers;
    if (points !== undefined) {
        question.points = points;
        quiz.totalPoints = quiz.totalPoints - oldPoints + points;
    }
    if (difficulty) question.difficulty = difficulty;
    if (explanation !== undefined) question.explanation = explanation.trim();
    if (tags) question.tags = tags;
    if (source !== undefined) question.source = source.trim();

    await question.save();
    await quiz.save();

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Question updated successfully",
        data: question
    });
});

const deleteQuestion = asyncWrapper(async (req, res) => {
    const { quizId, questionId } = req.params;
    const userId = req.user.userId;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) throw new NOT_FOUND("Quiz not found");
    if (quiz.createdBy.toString() !== userId) throw new UNAUTHORIZED("You can only edit your own quizzes");

    const question = await quizQuestionModel.findOne({ _id: questionId, quiz: quizId, isDeleted: false });
    if (!question) throw new NOT_FOUND("Question not found");

    // Soft delete
    question.isDeleted = true;
    question.deletedAt = new Date();
    question.deletedBy = userId;
    await question.save();

    // Update quiz totals
    quiz.totalPoints -= question.points;
    quiz.totalQuestions -= 1;
    await quiz.save();

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Question deleted successfully"
    });
});

const reorderQuestions = asyncWrapper(async (req, res) => {
    const { quizId } = req.params;
    const { orders } = req.body; // Array of { questionId, order }
    const userId = req.user.userId;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) throw new NOT_FOUND("Quiz not found");
    if (quiz.createdBy.toString() !== userId) throw new UNAUTHORIZED("You can only edit your own quizzes");

    // Update orders
    for (const item of orders) {
        await quizQuestionModel.updateOne(
            { _id: item.questionId, quiz: quizId, isDeleted: false },
            { order: item.order }
        );
    }

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Questions reordered successfully"
    });
});

const updateSettings = asyncWrapper(async (req, res) => {
    const { quizId } = req.params;
    const { timeLimitMinutes, attemptsAllowed, passingScorePercent, randomizeQuestions, allowBackNavigation, showProgressBar, showResults } = req.body;
    const userId = req.user.userId;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) throw new NOT_FOUND("Quiz not found");
    if (quiz.createdBy.toString() !== userId) throw new UNAUTHORIZED("You can only edit your own quizzes");

    if (timeLimitMinutes !== undefined) quiz.settings.timeLimitMinutes = timeLimitMinutes;
    if (attemptsAllowed !== undefined) quiz.settings.attemptsAllowed = attemptsAllowed;
    if (passingScorePercent !== undefined) quiz.settings.passingScorePercent = passingScorePercent;
    if (randomizeQuestions !== undefined) quiz.settings.randomizeQuestions = randomizeQuestions;
    if (allowBackNavigation !== undefined) quiz.settings.allowBackNavigation = allowBackNavigation;
    if (showProgressBar !== undefined) quiz.settings.showProgressBar = showProgressBar;
    if (showResults !== undefined) quiz.settings.showResults = showResults;

    await quiz.save();

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Quiz settings updated",
        data: quiz
    });
});

const setStatus = asyncWrapper(async (req, res) => {
    const { quizId } = req.params;
    const { status, publishAt } = req.body;
    const userId = req.user.userId;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) throw new NOT_FOUND("Quiz not found");
    if (quiz.createdBy.toString() !== userId) throw new UNAUTHORIZED("You can only edit your own quizzes");

    // Can only publish from draft or scheduled status
    if (status === 'published' && !['draft', 'scheduled'].includes(quiz.status)) {
        throw new BAD_REQUEST("Can only publish draft or scheduled quizzes");
    }

    // Require at least one question
    if ((status === 'published' || status === 'scheduled') && quiz.totalQuestions === 0) {
        throw new BAD_REQUEST("Cannot publish quiz without questions");
    }

    // Scheduled status requires publishAt
    if (status === 'scheduled' && !publishAt) {
        throw new BAD_REQUEST("publishAt date required for scheduled status");
    }

    quiz.status = status;
    if (status === 'scheduled') {
        quiz.publishAt = new Date(publishAt);
    }

    await quiz.save();

    return res.status(StatusCodes.OK).json({
        success: true,
        message: `Quiz ${status === 'published' ? 'published' : 'scheduled'} successfully`,
        data: quiz
    });
});

const getQuizById = asyncWrapper(async (req, res) => {
    const { quizId } = req.params;

    const quiz = await quizModel
        .findOne({ _id: quizId, isDeleted: false })
        .populate('course', 'courseTitle')
        .populate('module', 'moduleTitle')
        .populate('createdBy', 'userName email');

    if (!quiz) throw new NOT_FOUND("Quiz not found");

    // Get questions
    const questions = await quizQuestionModel
        .find({ quiz: quizId, isDeleted: false })
        .sort({ order: 1 });

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Quiz retrieved successfully",
        data: { ...quiz._doc, questions }
    });
});

const listMyQuizzes = asyncWrapper(async (req, res) => {
    const userId = req.user.userId;
    const { status, courseId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filter = { createdBy: userId, isDeleted: false };
    if (status) filter.status = status;
    if (courseId) filter.course = courseId;

    const quizzes = await quizModel
        .find(filter)
        .populate('course', 'courseTitle')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await quizModel.countDocuments(filter);

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Quizzes retrieved successfully",
        data: quizzes,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

const getQuizSummary = asyncWrapper(async (req, res) => {
    const { quizId } = req.params;

    const quiz = await quizModel.findOne({ _id: quizId, isDeleted: false });
    if (!quiz) throw new NOT_FOUND("Quiz not found");

    const questions = await quizQuestionModel.countDocuments({ quiz: quizId, isDeleted: false });

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Quiz summary retrieved",
        data: {
            _id: quiz._id,
            title: quiz.title,
            status: quiz.status,
            totalPoints: quiz.totalPoints,
            totalQuestions: quiz.totalQuestions,
            settings: quiz.settings,
            createdAt: quiz.createdAt
        }
    });
});

const getInstructorDashboard = asyncWrapper(async (req, res) => {
    const userId = req.user.userId;

    // Get all instructor's quizzes AND populate course info
    const allQuizzes = await quizModel
        .find({ createdBy: userId, isDeleted: false })
        .populate('course', 'courseTitle courseThumbnail'); // ✅ populate course title & thumbnail

    // Count quizzes by status
    const draftQuizzes = allQuizzes.filter(q => q.status === 'draft');
    const publishedQuizzes = allQuizzes.filter(q => q.status === 'published');
    const scheduledQuizzes = allQuizzes.filter(q => q.status === 'scheduled');

    // Get all quiz IDs for this instructor
    const quizIds = allQuizzes.map(q => q._id);

    // Get all attempts for instructor's quizzes
    const attempts = await quizAttemptModel.find({
        quiz: { $in: quizIds },
        isDeleted: false
    });

    // Calculate completion stats
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'graded').length;
    const averageCompletion = totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;

    // Calculate average score
    const submittedAttempts = attempts.filter(a => a.percentage !== null);
    const averageScore = submittedAttempts.length > 0
        ? Math.round(submittedAttempts.reduce((sum, a) => sum + a.percentage, 0) / submittedAttempts.length)
        : 0;

    // Quiz details with stats
    const quizDetails = await Promise.all(
        allQuizzes.map(async (quiz) => {
            const quizAttempts = attempts.filter(a => a.quiz.toString() === quiz._id.toString());
            const questionCount = await quizQuestionModel.countDocuments({ quiz: quiz._id, isDeleted: false });
            const passedCount = quizAttempts.filter(a => a.isPassed === true).length;
            const failedCount = quizAttempts.filter(a => a.isPassed === false).length;

            return {
                _id: quiz._id,
                title: quiz.title,
                status: quiz.status,
                totalQuestions: questionCount,
                totalPoints: quiz.totalPoints,
                totalAttempts: quizAttempts.length,
                completedAttempts: quizAttempts.filter(a => a.status === 'submitted' || a.status === 'graded').length,
                passedStudents: passedCount,
                failedStudents: failedCount,
                averageScore: quizAttempts.length > 0
                    ? Math.round(quizAttempts.filter(a => a.percentage !== null).reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.filter(a => a.percentage !== null).length)
                    : 0,
                createdAt: quiz.createdAt,
                publishAt: quiz.publishAt,
                course: quiz.course ? {
                    courseTitle: quiz.course.courseTitle,
                    courseThumbnail: quiz.course.courseThumbnail
                } : null // ✅ include course info
            };
        })
    );

    // Aggregated stats
    const stats = {
        totalQuizzes: allQuizzes.length,
        pendingDrafts: draftQuizzes.length,
        publishedQuizzes: publishedQuizzes.length,
        scheduledReleases: scheduledQuizzes.length,
        totalAttempts,
        completedAttempts,
        averageCompletion,
        averageScore
    };

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Instructor dashboard data retrieved successfully",
        data: {
            stats,
            quizzes: quizDetails
        }
    });
});

export {
    createQuiz,
    updateQuizInfo,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    updateSettings,
    setStatus,
    getQuizById,
    listMyQuizzes,
    getQuizSummary,
    getInstructorDashboard
};
