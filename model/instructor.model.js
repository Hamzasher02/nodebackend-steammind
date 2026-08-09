import mongo from "mongoose";
const instructorSchema = new mongo.Schema({
    qualification: {
        type: String,
        required: [true, 'Parent phone number is required'],
        trim: true,
    },
    degreeTitle: {
        type: String,
        required: [true, "Please provide degree name"]
    },
    graduationYear: {
        type: Number,
        required: [true, "Please provide graduation year"]
    },
    totalMarks: {
        type: Number,
        required: [true, "Please provide total marks"]
    },
    obtainedMarks: {
        type: Number,
        required: [true, "Please provide obtained marks"]
    },
    institution: {
        type: String,
        required: [true, "Please provide institute"]
    },
    transcript: {
        publicId: {
            type: String,
            required: [true, 'please upload transcript'],
        },
        secureUrl: {
            type: String,
            required: [true, 'Please upload transcript'],
        },
    },
    transcriptVerification: {
        status: {
            type: Boolean,
            default: true,
        },
        verifiedBy: {
            type: mongo.Types.ObjectId,
            ref: "Staff",
            default: null
        },
        verifiedAt: {
            type: Date,
            default: null
        }
    },
    //admin request this is true then on admin side a message will be shown that you need to upload your transcript again upon login in the pop messaage
    //if status is set to true and profile is in pending state
    //front end developer will hit thie endpoint when instructor login
    newTranscriptRequest: {
        status: {
            type: Boolean,
            default: false
        },
        message: {
            type: String,
            default: null
        },
    },
    coursePreferences: [
        {
            type: mongo.Types.ObjectId,
            ref: 'Course',
            required: true
        }
    ],
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true
    },

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
instructorSchema.virtual("user", {
    ref: "User",
    foreignField: '_id',
    localField: "createdBy",
    justOne: true,
    options: {
        select: "firstName email lastName profilePicture"
    }
})
instructorSchema.virtual("availability", {
    ref: "Availability",
    localField: "createdBy",   // The User ID stored in Instructor
    foreignField: "instructorId", // The User ID stored in Availability
    justOne: false             // Allows returning an array of time slots
});
const instructorModel = mongo.model('Instructor', instructorSchema)
export default instructorModel