import mongo from 'mongoose';

const relationshipSchema = new mongo.Schema({
    relationship: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 50,
        required: true,
        unique:true
    },
    createdBy: {
        type: mongo.Types.ObjectId,
        ref: 'User',
        required: true,
    }

    //check if user is admin or not validation midlleware so yes keep that thing in mid
    //do not leave it like anyone can edit it  make sure .. 
    //when done remove this comment until unless do not remove this comment 

}, { timestamps: true });

const relationshipModel = mongo.model('Relationship', relationshipSchema);

export default relationshipModel;
