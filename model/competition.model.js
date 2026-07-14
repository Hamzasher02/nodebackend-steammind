import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    publicId: {
        type: String,
        required: true
    },
    secureUrl: {
        type: String,
        required: true
    }
}, { _id: false });

const contentBlockSchema = new mongoose.Schema({
    blockType: {
        type: String,
        enum: ['heading', 'subheading', 'list', 'text'],
        required: true
    },
    headingText: {
        type: String,
        trim: true
    },
    listItems: {
        type: [String],
        default: []
    },
    paragraphText: {
        type: String,
        trim: true
    }
});

const competitionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    competitionType: {
        type: String,
        enum: ['practice', 'official'],
        default: 'official'
    },
    urlSlug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hostedBy: {
        type: String,
        default: 'STEAM MINDS',
        trim: true
    },
    shortDescription: {
        type: String,
        default: '',
        trim: true
    },
    thumbnail: {
        type: imageSchema,
        required: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    teamSize: {
        min: {
            type: Number,
            default: 1
        },
        max: {
            type: Number,
            default: 4
        }
    },
    gradeRange: {
        type: [String],
        default: []
    },
    maximumParticipants: {
        type: Number,
        default: null
    },
    registrationStatus: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    registrationFee: {
        type: String,
        enum: ['free', 'paid'],
        default: 'free'
    },
    allowSaveInfo: {
        type: Boolean,
        default: false
    },
    contentBlocks: {
        type: [contentBlockSchema],
        default: []
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    }
}, { timestamps: true });

// Backward compatibility helper for dashboard 'state'
competitionSchema.virtual('state').get(function() {
    const now = new Date();
    if (this.startDate && now < this.startDate) {
        return 'upcoming';
    } else if (this.endDate && now > this.endDate) {
        return 'completed';
    }
    return 'ongoing';
});

// Ensure virtuals are serialized
competitionSchema.set('toJSON', { virtuals: true });
competitionSchema.set('toObject', { virtuals: true });

const competitionModel = mongoose.model('Competition', competitionSchema);

export default competitionModel;
