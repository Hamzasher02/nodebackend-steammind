import cleanupUploadedFiles, {
    handleCloudinaryUpload,
    handleMultipleCloudinaryUploads,
    safeJsonParse
} from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import aboutUsPageModel from '../model/aboutuspage.model.js';
import { deleteFromCloud } from '../services/cloudinary.uploader.services.js';
import { StatusCodes } from 'http-status-codes';
// Helper to get or create the page document
async function getOrCreateAboutUsPage() {
    let page = await aboutUsPageModel.findOne();
    if (!page) {
        page = await aboutUsPageModel.create({
            hero: { backgroundImages: [] },
            introduction: { paragraphs: [] },
            platforms: [],
            missionVision: [],
            partners: [],
            articles: [],
            strategicPartnerships: [],
            coreTeam: [],
            supportingTeam: []
        });
    }
    return page;
}

// 1. Get About Us Page Content
const getAboutUsPage = asyncWrapper(async (req, res) => {
    const page = await getOrCreateAboutUsPage();
    res.status(StatusCodes.OK).json({
        success: true,
        data: page
    });
});

// 2. Update Hero
const updateHero = asyncWrapper(async (req, res) => {
    const { existingImages } = req.body;
    const page = await getOrCreateAboutUsPage();

    let finalBackgroundImages = [...page.hero.backgroundImages];

    if (existingImages) {
        const keptImages = safeJsonParse(req, existingImages, 'Invalid existingImages JSON format');
        const keptPublicIds = new Set(keptImages.map(img => img.publicId));
        const imagesToDelete = page.hero.backgroundImages.filter(img => !keptPublicIds.has(img.publicId));

        for (const img of imagesToDelete) {
            await deleteFromCloud(img.publicId);
        }

        finalBackgroundImages = page.hero.backgroundImages.filter(img => keptPublicIds.has(img.publicId));
    }

    if (req.files && req.files.length > 0) {
        const uploadedImages = await handleMultipleCloudinaryUploads(req, req.files);
        finalBackgroundImages.push(...uploadedImages);
    }

    page.hero.backgroundImages = finalBackgroundImages;
    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Hero background images updated successfully',
        data: page.hero
    });
});

// 3. Update Introduction
const updateIntroduction = asyncWrapper(async (req, res) => {
    const { paragraphs } = req.body;
    const page = await getOrCreateAboutUsPage();

    const finalParagraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];

    page.introduction.paragraphs = finalParagraphs;
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Introduction paragraphs updated successfully',
        data: page.introduction
    });
});

// 4. Platforms CRUD
const addPlatform = asyncWrapper(async (req, res) => {
    const { title, paragraphs } = req.body;

    if (!req.files || !req.files['image'] || !req.files['icon']) {
        cleanupUploadedFiles(req);
        throw new BAD_REQUEST('Both image and icon files are required for platform');
    }

    const page = await getOrCreateAboutUsPage();
    let imageCloud, iconCloud;

    imageCloud = await handleCloudinaryUpload(req, req.files['image'][0]);
    try {
        iconCloud = await handleCloudinaryUpload(req, req.files['icon'][0]);
    } catch (err) {
        if (imageCloud) await deleteFromCloud(imageCloud.publicId);
        throw err;
    }

    const finalParagraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];

    const newPlatform = {
        image: imageCloud,
        icon: iconCloud,
        title,
        paragraphs: finalParagraphs
    };

    page.platforms.push(newPlatform);
    await page.save();
    cleanupUploadedFiles(req);

    const added = page.platforms[page.platforms.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Platform added successfully',
        data: added
    });
});

const updatePlatform = asyncWrapper(async (req, res) => {
    const { platformId } = req.params;
    const { title, paragraphs } = req.body;

    const page = await getOrCreateAboutUsPage();
    const platform = page.platforms.id(platformId);

    if (!platform) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Platform not found');
    }

    let newImage = platform.image;
    let newIcon = platform.icon;

    if (req.files && req.files['image']) {
        newImage = await handleCloudinaryUpload(req, req.files['image'][0], platform.image.publicId);
    }

    if (req.files && req.files['icon']) {
        newIcon = await handleCloudinaryUpload(req, req.files['icon'][0], platform.icon.publicId);
    }

    if (title !== undefined) platform.title = title;
    if (paragraphs !== undefined) {
        platform.paragraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];
    }
    platform.image = newImage;
    platform.icon = newIcon;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Platform updated successfully',
        data: platform
    });
});

const deletePlatform = asyncWrapper(async (req, res) => {
    const { platformId } = req.params;

    const page = await getOrCreateAboutUsPage();
    const platform = page.platforms.id(platformId);

    if (!platform) {
        throw new NOT_FOUND('Platform not found');
    }

    try {
        await deleteFromCloud(platform.image.publicId);
        await deleteFromCloud(platform.icon.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting platform assets from Cloudinary:", error);
    }

    page.platforms.pull(platformId);
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Platform deleted successfully'
    });
});

// 5. Mission/Vision CRUD
const addMissionSection = asyncWrapper(async (req, res) => {
    const { title, heading, paragraphs } = req.body;

    if (!req.files || !req.files['image'] || !req.files['icon']) {
        cleanupUploadedFiles(req);
        throw new BAD_REQUEST('Both image and icon files are required');
    }

    const page = await getOrCreateAboutUsPage();
    let imageCloud, iconCloud;

    imageCloud = await handleCloudinaryUpload(req, req.files['image'][0]);
    try {
        iconCloud = await handleCloudinaryUpload(req, req.files['icon'][0]);
    } catch (err) {
        if (imageCloud) await deleteFromCloud(imageCloud.publicId);
        throw err;
    }

    const finalParagraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];

    const newSection = {
        image: imageCloud,
        icon: iconCloud,
        title,
        heading,
        paragraphs: finalParagraphs
    };

    page.missionVision.push(newSection);
    await page.save();
    cleanupUploadedFiles(req);

    const added = page.missionVision[page.missionVision.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Mission/Vision section added successfully',
        data: added
    });
});

const updateMissionSection = asyncWrapper(async (req, res) => {
    const { sectionId } = req.params;
    const { title, heading, paragraphs } = req.body;

    const page = await getOrCreateAboutUsPage();
    const section = page.missionVision.id(sectionId);

    if (!section) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Mission/Vision section not found');
    }

    let newImage = section.image;
    let newIcon = section.icon;

    if (req.files && req.files['image']) {
        newImage = await handleCloudinaryUpload(req, req.files['image'][0], section.image.publicId);
    }

    if (req.files && req.files['icon']) {
        newIcon = await handleCloudinaryUpload(req, req.files['icon'][0], section.icon.publicId);
    }

    if (title !== undefined) section.title = title;
    if (heading !== undefined) section.heading = heading;
    if (paragraphs !== undefined) {
        section.paragraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];
    }
    section.image = newImage;
    section.icon = newIcon;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Mission/Vision section updated successfully',
        data: section
    });
});

const deleteMissionSection = asyncWrapper(async (req, res) => {
    const { sectionId } = req.params;

    const page = await getOrCreateAboutUsPage();
    const section = page.missionVision.id(sectionId);

    if (!section) {
        throw new NOT_FOUND('Mission/Vision section not found');
    }

    try {
        await deleteFromCloud(section.image.publicId);
        await deleteFromCloud(section.icon.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting mission section assets from Cloudinary:", error);
    }

    page.missionVision.pull(sectionId);
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Mission/Vision section deleted successfully'
    });
});

// 6. Partners CRUD
const addPartner = asyncWrapper(async (req, res) => {
    if (!req.file) {
        throw new BAD_REQUEST('Partner logo image file is required');
    }

    const page = await getOrCreateAboutUsPage();
    const cloudResult = await handleCloudinaryUpload(req, req.file);

    page.partners.push({ logo: cloudResult });
    await page.save();
    cleanupUploadedFiles(req);

    const added = page.partners[page.partners.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Partner logo added successfully',
        data: added
    });
});

const deletePartner = asyncWrapper(async (req, res) => {
    const { partnerId } = req.params;

    const page = await getOrCreateAboutUsPage();
    const partner = page.partners.id(partnerId);

    if (!partner) {
        throw new NOT_FOUND('Partner not found');
    }

    try {
        await deleteFromCloud(partner.logo.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting partner logo from Cloudinary:", error);
    }

    page.partners.pull(partnerId);
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Partner deleted successfully'
    });
});

// 7. Articles CRUD
const addArticle = asyncWrapper(async (req, res) => {
    const { heading, paragraphs } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Article icon is required');
    }

    const page = await getOrCreateAboutUsPage();
    const cloudResult = await handleCloudinaryUpload(req, req.file);
    const finalParagraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];

    const newArticle = {
        icon: cloudResult,
        heading,
        paragraphs: finalParagraphs
    };

    page.articles.push(newArticle);
    await page.save();
    cleanupUploadedFiles(req);

    const added = page.articles[page.articles.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Article added successfully',
        data: added
    });
});

const updateArticle = asyncWrapper(async (req, res) => {
    const { articleId } = req.params;
    const { heading, paragraphs } = req.body;

    const page = await getOrCreateAboutUsPage();
    const article = page.articles.id(articleId);

    if (!article) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Article not found');
    }

    let newIcon = article.icon;
    if (req.file) {
        newIcon = await handleCloudinaryUpload(req, req.file, article.icon.publicId);
    }

    if (heading !== undefined) article.heading = heading;
    if (paragraphs !== undefined) {
        article.paragraphs = safeJsonParse(req, paragraphs, 'Invalid paragraphs JSON format') || [];
    }
    article.icon = newIcon;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Article updated successfully',
        data: article
    });
});

const deleteArticle = asyncWrapper(async (req, res) => {
    const { articleId } = req.params;

    const page = await getOrCreateAboutUsPage();
    const article = page.articles.id(articleId);

    if (!article) {
        throw new NOT_FOUND('Article not found');
    }

    try {
        await deleteFromCloud(article.icon.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting article icon from Cloudinary:", error);
    }

    page.articles.pull(articleId);
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Article deleted successfully'
    });
});

// 8. Strategic Partnerships CRUD
const addStrategicPartner = asyncWrapper(async (req, res) => {
    const { text } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Strategic partner image file is required');
    }

    const page = await getOrCreateAboutUsPage();
    const cloudResult = await handleCloudinaryUpload(req, req.file);

    const newPartner = {
        image: cloudResult,
        text
    };

    page.strategicPartnerships.push(newPartner);
    await page.save();
    cleanupUploadedFiles(req);

    const added = page.strategicPartnerships[page.strategicPartnerships.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Strategic partner added successfully',
        data: added
    });
});

const updateStrategicPartner = asyncWrapper(async (req, res) => {
    const { partnerId } = req.params;
    const { text } = req.body;

    const page = await getOrCreateAboutUsPage();
    const partner = page.strategicPartnerships.id(partnerId);

    if (!partner) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Strategic partner not found');
    }

    let newImage = partner.image;
    if (req.file) {
        newImage = await handleCloudinaryUpload(req, req.file, partner.image.publicId);
    }

    if (text !== undefined) partner.text = text;
    partner.image = newImage;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Strategic partner updated successfully',
        data: partner
    });
});

const deleteStrategicPartner = asyncWrapper(async (req, res) => {
    const { partnerId } = req.params;

    const page = await getOrCreateAboutUsPage();
    const partner = page.strategicPartnerships.id(partnerId);

    if (!partner) {
        throw new NOT_FOUND('Strategic partner not found');
    }

    try {
        await deleteFromCloud(partner.image.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting strategic partner image from Cloudinary:", error);
    }

    page.strategicPartnerships.pull(partnerId);
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Strategic partner deleted successfully'
    });
});

// 9. Core Team Members
const addCoreMember = asyncWrapper(async (req, res) => {
    const { name, designation } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Member photo file is required');
    }

    const page = await getOrCreateAboutUsPage();
    const cloudResult = await handleCloudinaryUpload(req, req.file);

    const newMember = { image: cloudResult, name, designation };
    page.coreTeam.push(newMember);

    await page.save();
    cleanupUploadedFiles(req);

    const added = page.coreTeam[page.coreTeam.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Core team member added successfully',
        data: added
    });
});

const updateCoreMember = asyncWrapper(async (req, res) => {
    const { memberId } = req.params;
    const { name, designation } = req.body;

    const page = await getOrCreateAboutUsPage();
    const member = page.coreTeam.id(memberId);

    if (!member) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Core team member not found');
    }

    let newImage = member.image;
    if (req.file) {
        newImage = await handleCloudinaryUpload(req, req.file, member.image.publicId);
    }

    if (name !== undefined) member.name = name;
    if (designation !== undefined) member.designation = designation;
    member.image = newImage;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Core team member updated successfully',
        data: member
    });
});

const deleteCoreMember = asyncWrapper(async (req, res) => {
    const { memberId } = req.params;

    const page = await getOrCreateAboutUsPage();
    const member = page.coreTeam.id(memberId);

    if (!member) {
        throw new NOT_FOUND('Core team member not found');
    }

    try {
        await deleteFromCloud(member.image.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting core member image from Cloudinary:", error);
    }

    page.coreTeam.pull(memberId);
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Core team member deleted successfully'
    });
});

// 10. Supporting Team Members
const addSupportingMember = asyncWrapper(async (req, res) => {
    const { name, designation } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Member photo file is required');
    }

    const page = await getOrCreateAboutUsPage();
    const cloudResult = await handleCloudinaryUpload(req, req.file);

    const newMember = { image: cloudResult, name, designation };
    page.supportingTeam.push(newMember);

    await page.save();
    cleanupUploadedFiles(req);

    const added = page.supportingTeam[page.supportingTeam.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Supporting team member added successfully',
        data: added
    });
});

const updateSupportingMember = asyncWrapper(async (req, res) => {
    const { memberId } = req.params;
    const { name, designation } = req.body;

    const page = await getOrCreateAboutUsPage();
    const member = page.supportingTeam.id(memberId);

    if (!member) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Supporting team member not found');
    }

    let newImage = member.image;
    if (req.file) {
        newImage = await handleCloudinaryUpload(req, req.file, member.image.publicId);
    }

    if (name !== undefined) member.name = name;
    if (designation !== undefined) member.designation = designation;
    member.image = newImage;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Supporting team member updated successfully',
        data: member
    });
});

const deleteSupportingMember = asyncWrapper(async (req, res) => {
    const { memberId } = req.params;

    const page = await getOrCreateAboutUsPage();
    const member = page.supportingTeam.id(memberId);

    if (!member) {
        throw new NOT_FOUND('Supporting team member not found');
    }

    try {
        await deleteFromCloud(member.image.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting supporting member image from Cloudinary:", error);
    }

    page.supportingTeam.pull(memberId);
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Supporting team member deleted successfully'
    });
});

export {
    getAboutUsPage,
    updateHero,
    updateIntroduction,
    addPlatform,
    updatePlatform,
    deletePlatform,
    addMissionSection,
    updateMissionSection,
    deleteMissionSection,
    addPartner,
    deletePartner,
    addArticle,
    updateArticle,
    deleteArticle,
    addStrategicPartner,
    updateStrategicPartner,
    deleteStrategicPartner,
    addCoreMember,
    updateCoreMember,
    deleteCoreMember,
    addSupportingMember,
    updateSupportingMember,
    deleteSupportingMember
};
