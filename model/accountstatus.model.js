import mongo from 'mongoose';

const accountStatusSchema = new mongo.Schema({
    accountStatus: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 50,
        required: true,
        unique:true,
       
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true,
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
        type: mongoose.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    restoredAt: {
        type: Date,
        default: null
    },
    restoredBy: {
        type: mongoose.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    //check if user is admin or not validation midlleware so yes keep that thing in mid
    //do not spare it like anyone can add itmake sure .. 
    //when done remove this comment until unless do not remove this comment 
}, { timestamps: true });

const accountStatusModel = mongo.model('AccountStatus', accountStatusSchema);

export default accountStatusModel;
