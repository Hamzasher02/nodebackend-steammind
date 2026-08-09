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

const platformSchema = new mongoose.Schema({
    image: {
        type: imageSchema,
        required: true
    },
    icon: {
        type: imageSchema,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    paragraphs: {
        type: [String],
        default: []
    }
});

const missionVisionSchema = new mongoose.Schema({
    image: {
        type: imageSchema,
        required: true
    },
    icon: {
        type: imageSchema,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    heading: {
        type: String,
        required: true,
        trim: true
    },
    paragraphs: {
        type: [String],
        default: []
    }
});

const articleSchema = new mongoose.Schema({
    icon: {
        type: imageSchema,
        required: true
    },
    heading: {
        type: String,
        required: true,
        trim: true
    },
    paragraphs: {
        type: [String],
        default: []
    }
});

const strategicPartnershipSchema = new mongoose.Schema({
    image: {
        type: imageSchema,
        required: true
    },
    text: {
        type: String,
        default: '',
        trim: true
    }
});

const teamMemberSchema = new mongoose.Schema({
    image: {
        type: imageSchema,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    designation: {
        type: String,
        required: true,
        trim: true
    }
});

const aboutUsPageSchema = new mongoose.Schema({
    hero: {
        backgroundImages: {
            type: [imageSchema],
            default: []
        }
    },
    introduction: {
        paragraphs: {
            type: [String],
            default: []
        }
    },
    platforms: {
        type: [platformSchema],
        default: []
    },
    missionVision: {
        type: [missionVisionSchema],
        default: []
    },
    partners: [{
        logo: {
            type: imageSchema,
            required: true
        }
    }],
    articles: {
        type: [articleSchema],
        default: []
    },
    strategicPartnerships: {
        type: [strategicPartnershipSchema],
        default: []
    },
    coreTeam: {
        type: [teamMemberSchema],
        default: []
    },
    supportingTeam: {
        type: [teamMemberSchema],
        default: []
    }
}, { timestamps: true });

const aboutUsPageModel = mongoose.model('AboutUsPage', aboutUsPageSchema);

export default aboutUsPageModel;
