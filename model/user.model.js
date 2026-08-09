import mongo from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongo.Schema({
    firstName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
        required: true
    },
    fatherName: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 15,
        required: true
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        trim: true,
        unique: [true, 'email must be unique'],
    },
    profilePicture: {
        secureUrl: {
            type: String,
            required: true,
            unique: true
        },
        publicId: {
            type: String,
            required: true,
            unique: true
        }
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    bio: {
        type: String,
        required: true,
        maxlength: 100,
        minlength: 20,
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        trim: true,
        select: false
    },
    phoneNumber: {
        type: String,
        required: [true, 'contact number is required'],
        trim: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['instructor', 'student'],
        required: true
    },
    accountStatus: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'flagged'],
        default: "pending",
        //ask about what default value to keep like when new user register
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneNumberVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationDate: {
        type: Date,
        default: null
    },
    phoneNumberVerificationDate: {
        type: Date,
        default: null
    },
    consentAccepted: {
        type: Boolean,
        required: [true, 'Please provide consent'],
    },
    lastLogin: {
        type: Date,
        default: null
        //update on login
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
        ref: 'Staff',
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongo.Types.ObjectId,
        ref: 'Staff',
        default: null
    }

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

userSchema.pre("save", async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})
userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password)
}

userSchema.virtual("student", {
    ref: "Student",
    localField: "_id",
    foreignField: "createdBy",
    justOne: true, //one user = one student
});

userSchema.virtual("instructor", {
    ref: "Instructor",
    localField: "_id",
    foreignField: "createdBy",
    justOne: true, // same rzn as abv
});

const userModel = mongo.model('User', userSchema)
export default userModel