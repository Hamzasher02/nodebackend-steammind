import express from 'express'
const app = express()
app.set('trust proxy', 1);
import cors from 'cors'
import morgan from 'morgan'
import authRouter from './router/auth.router.js'
import userRouter from './router/user.router.js'
import staffRouter from './router/staff.router.js'
import roleRouter from './router/role.router.js'
import categoryRouter from './router/category.router.js'
import courseRouter from './router/course.router.js'
import instructorRouter from './router/instructor.router.js'
import customErrorHandler from './middleware/customerrorhandler.middleware.js'
import courseOutcomeRouter from './router/courseoutcome.router.js'
import courseModuleRouter from './router/coursemodule.router.js'
import courseLectureRouter from './router/courselecture.router.js'
import coursePdfMaterialRouter from './router/coursepdfmaterial.router.js'
import activityTypeRouter from './router/activitytype.router.js'
import activityLogRouter from './router/activitylog.router.js'
import courseBundleRouter from './router/coursebundle.router.js'
import quizRouter from './router/quiz.router.js'
import studentQuizRouter from './router/studentquiz.router.js'
import routeNotFoundMiddleware from './middleware/routenotfound.middleware.js'
import cookieParser from 'cookie-parser'
import cartRouter from './router/cart.router.js'
import enrollmentRouter from './router/enrollment.router.js'
import courseFeedbackRouter from './router/coursefeedback.router.js'
import demoSessionRouter from './router/demosessionrequest.router.js'
import courseSessionRouter from './router/coursesession.router.js'
import deletionHistoryRouter from './router/deletionhistory.router.js'
import publicRouter from './router/public.router.js'
import discussionRouter from './router/discussion.router.js'
import studentProgressRouter from './router/studentprogress.router.js'
import nameChangeRouter from './router/namechangerequest.router.js'
import homepageRouter from './router/homepage.router.js'
import coursesPageRouter from './router/coursespage.router.js'
import aboutUsPageRouter from './router/aboutuspage.router.js'
import productsPageRouter from './router/productspage.router.js'
import contactUsPageRouter from './router/contactuspage.router.js'
import campPageRouter from './router/camppage.router.js'
import blogRouter from './router/blog.router.js'
import competitionRouter from './router/competition.router.js'
import logosRouter from './router/logos.router.js'
import competitionRegistrationRouter from './router/competitionregistration.router.js'
import chatRouter from './router/chat.router.js'
import chatModerationRouter from './router/chatmoderation.router.js'
//security pacakges
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
const baseUrl = process.env.BASE_PATH || '/api/v1'
app.use(cors({
    origin:true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
}));

app.use(helmet())
app.use(morgan('tiny'))
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET))
app.use(express.json({ limit: '50kb' }))
app.use(express.urlencoded({ extended: false }))

app.get(baseUrl, (req, res) => {
    res.send('Welcome to steammind')
})
app.use(`${baseUrl}/auth`, authRouter)
app.use(`${baseUrl}/user`, userRouter)
app.use(`${baseUrl}/staff`, staffRouter)
app.use(`${baseUrl}/role`, roleRouter)
app.use(`${baseUrl}/category`, categoryRouter)
app.use(`${baseUrl}/course`, courseRouter)
app.use(`${baseUrl}/instructor`, instructorRouter)
// Routing setup for various course-related endpoints
// Added by Hamza Hanif on November 6, 2025
app.use(`${baseUrl}/outcome`, courseOutcomeRouter)
app.use(`${baseUrl}/coursemodules`, courseModuleRouter)
app.use(`${baseUrl}/courselectures`, courseLectureRouter)
app.use(`${baseUrl}/coursepdfmaterial`, coursePdfMaterialRouter)
app.use(`${baseUrl}/activitytypes`, activityTypeRouter)
app.use(`${baseUrl}/activitylogs`, activityLogRouter)
app.use(`${baseUrl}/coursebundle`, courseBundleRouter)
app.use(`${baseUrl}/quiz`, quizRouter)
app.use(`${baseUrl}/studentquiz`, studentQuizRouter)
app.use(`${baseUrl}/cart`, cartRouter)
app.use(`${baseUrl}/enrollment`, enrollmentRouter)
app.use(`${baseUrl}/coursefeedback`, courseFeedbackRouter)
app.use(`${baseUrl}/demosession`, demoSessionRouter)
app.use(`${baseUrl}/coursesession`, courseSessionRouter)
app.use(`${baseUrl}/deletionhistory`, deletionHistoryRouter)
app.use(`${baseUrl}/public`, publicRouter)
app.use(`${baseUrl}/discussion`, discussionRouter)
app.use(`${baseUrl}/studentprogress`, studentProgressRouter)
app.use(`${baseUrl}/namechange`, nameChangeRouter)
app.use(`${baseUrl}/homepage`, homepageRouter)
app.use(`${baseUrl}/coursespage`, coursesPageRouter)
app.use(`${baseUrl}/aboutuspage`, aboutUsPageRouter)
app.use(`${baseUrl}/productspage`, productsPageRouter)
app.use(`${baseUrl}/contactuspage`, contactUsPageRouter)
app.use(`${baseUrl}/camppage`, campPageRouter)
app.use(`${baseUrl}/blogs`, blogRouter)
app.use(`${baseUrl}/competitions`, competitionRouter)
app.use(`${baseUrl}/logos`, logosRouter)
app.use(`${baseUrl}/competition-registrations`, competitionRegistrationRouter)
app.use(`${baseUrl}`, chatRouter)
app.use(`${baseUrl}`, chatModerationRouter)
app.use(routeNotFoundMiddleware)
app.use(customErrorHandler)
export default app

