import mongo from 'mongoose'
import bcrypt from 'bcryptjs';

const staffSchema = new mongo.Schema({
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
    roleStatus: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: "inactive"
    },
    cryptoToken: {
        type: String,
        default: null
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        trim: true,
        select: false
    },
    lastLogin: {
        type: Date,
        default: null
        //update on login
    },
    role: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        // required: true,
        ref: 'Staff'
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
    },

}, { timestamps: true })


staffSchema.pre("save", async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})
staffSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password)
}
const staffModel = mongo.model("Staff", staffSchema)
export default staffModel