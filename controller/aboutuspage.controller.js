import fs from 'fs';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import aboutUsPageModel from '../model/aboutuspage.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Safe cleanup function supporting single file, array of files, and object of fields
function safeCleanup(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting single file:', err);
        });
    }
    if (req.files) {
        if (Array.isArray(req.files)) {
            req.files.forEach((f) => {
                fs.unlink(f.path, (err) => {
                    if (err) console.error('Error deleting array file:', err);
                });
            });
        } else {
            Object.keys(req.files).forEach((key) => {
                req.files[key].forEach((f) => {
                    fs.unlink(f.path, (err) => {
                        if (err) console.error(`Error deleting field file [${key}]:`, err);
                    });
                });
            });
        }
    }
}

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
    res.status(200).json({
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
        let keptImages = [];
        try {
            keptImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        } catch (err) {
            safeCleanup(req);
            throw new BAD_REQUEST('Invalid existingImages JSON format');
        }

        const keptPublicIds = new Set(keptImages.map(img => img.publicId));
        const imagesToDelete = page.hero.backgroundImages.filter(img => !keptPublicIds.has(img.publicId));

        for (const img of imagesToDelete) {
            await deleteFromCloud(img.publicId);
        }

        finalBackgroundImages = page.hero.backgroundImages.filter(img => keptPublicIds.has(img.publicId));
    }

    if (req.files && req.files.length > 0) {
        const uploadedImages = [];
        try {
            for (const file of req.files) {
                const cloudResult = await uploadToCloud(file.path);
                uploadedImages.push(cloudResult);
            }
        } catch (err) {
            for (const img of uploadedImages) {
                await deleteFromCloud(img.publicId);
            }
            safeCleanup(req);
            throw err;
        }
        finalBackgroundImages.push(...uploadedImages);
    }

    page.hero.backgroundImages = finalBackgroundImages;
    await page.save();
    safeCleanup(req);

    res.status(200).json({
        success: true,
        message: 'Hero background images updated successfully',
        data: page.hero
    });
});

// 3. Update Introduction
const updateIntroduction = asyncWrapper(async (req, res) => {
    const { paragraphs } = req.body;
    const page = await getOrCreateAboutUsPage();

    let finalParagraphs = [];
    if (paragraphs) {
        finalParagraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }

    page.introduction.paragraphs = finalParagraphs;
    await page.save();

    res.status(200).json({
        success: true,
        message: 'Introduction paragraphs updated successfully',
        data: page.introduction
    });
});

// 4. Platforms CRUD
const addPlatform = asyncWrapper(async (req, res) => {
    const { title, paragraphs } = req.body;

    if (!req.files || !req.files['image'] || !req.files['icon']) {
        safeCleanup(req);
        throw new BAD_REQUEST('Both image and icon files are required for platform');
    }

    const page = await getOrCreateAboutUsPage();
    let imageCloud, iconCloud;

    try {
        imageCloud = await uploadToCloud(req.files['image'][0].path);
        iconCloud = await uploadToCloud(req.files['icon'][0].path);
    } catch (err) {
        if (imageCloud) await deleteFromCloud(imageCloud.publicId);
        if (iconCloud) await deleteFromCloud(iconCloud.publicId);
        safeCleanup(req);
        throw err;
    }

    let finalParagraphs = [];
    if (paragraphs) {
        finalParagraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }

    const newPlatform = {
        image: imageCloud,
        icon: iconCloud,
        title,
        paragraphs: finalParagraphs
    };

    page.platforms.push(newPlatform);
    await page.save();
    safeCleanup(req);

    const added = page.platforms[page.platforms.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Platform not found');
    }

    let newImage = platform.image;
    let newIcon = platform.icon;

    try {
        if (req.files && req.files['image']) {
            const cloudResult = await uploadToCloud(req.files['image'][0].path);
            await deleteFromCloud(platform.image.publicId);
            newImage = cloudResult;
        }

        if (req.files && req.files['icon']) {
            const cloudResult = await uploadToCloud(req.files['icon'][0].path);
            await deleteFromCloud(platform.icon.publicId);
            newIcon = cloudResult;
        }
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    if (title !== undefined) platform.title = title;
    if (paragraphs !== undefined) {
        platform.paragraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }
    platform.image = newImage;
    platform.icon = newIcon;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
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

    await deleteFromCloud(platform.image.publicId);
    await deleteFromCloud(platform.icon.publicId);

    page.platforms.pull(platformId);
    await page.save();

    res.status(200).json({
        success: true,
        message: 'Platform deleted successfully'
    });
});

// 5. Mission/Vision CRUD
const addMissionSection = asyncWrapper(async (req, res) => {
    const { title, heading, paragraphs } = req.body;

    if (!req.files || !req.files['image'] || !req.files['icon']) {
        safeCleanup(req);
        throw new BAD_REQUEST('Both image and icon files are required');
    }

    const page = await getOrCreateAboutUsPage();
    let imageCloud, iconCloud;

    try {
        imageCloud = await uploadToCloud(req.files['image'][0].path);
        iconCloud = await uploadToCloud(req.files['icon'][0].path);
    } catch (err) {
        if (imageCloud) await deleteFromCloud(imageCloud.publicId);
        if (iconCloud) await deleteFromCloud(iconCloud.publicId);
        safeCleanup(req);
        throw err;
    }

    let finalParagraphs = [];
    if (paragraphs) {
        finalParagraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }

    const newSection = {
        image: imageCloud,
        icon: iconCloud,
        title,
        heading,
        paragraphs: finalParagraphs
    };

    page.missionVision.push(newSection);
    await page.save();
    safeCleanup(req);

    const added = page.missionVision[page.missionVision.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Mission/Vision section not found');
    }

    let newImage = section.image;
    let newIcon = section.icon;

    try {
        if (req.files && req.files['image']) {
            const cloudResult = await uploadToCloud(req.files['image'][0].path);
            await deleteFromCloud(section.image.publicId);
            newImage = cloudResult;
        }

        if (req.files && req.files['icon']) {
            const cloudResult = await uploadToCloud(req.files['icon'][0].path);
            await deleteFromCloud(section.icon.publicId);
            newIcon = cloudResult;
        }
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    if (title !== undefined) section.title = title;
    if (heading !== undefined) section.heading = heading;
    if (paragraphs !== undefined) {
        section.paragraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }
    section.image = newImage;
    section.icon = newIcon;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
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

    await deleteFromCloud(section.image.publicId);
    await deleteFromCloud(section.icon.publicId);

    page.missionVision.pull(sectionId);
    await page.save();

    res.status(200).json({
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
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    page.partners.push({ logo: cloudResult });
    await page.save();
    safeCleanup(req);

    const added = page.partners[page.partners.length - 1];

    res.status(201).json({
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

    await deleteFromCloud(partner.logo.publicId);

    page.partners.pull(partnerId);
    await page.save();

    res.status(200).json({
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
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    let finalParagraphs = [];
    if (paragraphs) {
        finalParagraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }

    const newArticle = {
        icon: cloudResult,
        heading,
        paragraphs: finalParagraphs
    };

    page.articles.push(newArticle);
    await page.save();
    safeCleanup(req);

    const added = page.articles[page.articles.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Article not found');
    }

    let newIcon = article.icon;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }
        await deleteFromCloud(article.icon.publicId);
        newIcon = cloudResult;
    }

    if (heading !== undefined) article.heading = heading;
    if (paragraphs !== undefined) {
        article.paragraphs = typeof paragraphs === 'string' ? JSON.parse(paragraphs) : paragraphs;
    }
    article.icon = newIcon;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
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

    await deleteFromCloud(article.icon.publicId);

    page.articles.pull(articleId);
    await page.save();

    res.status(200).json({
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
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    const newPartner = {
        image: cloudResult,
        text
    };

    page.strategicPartnerships.push(newPartner);
    await page.save();
    safeCleanup(req);

    const added = page.strategicPartnerships[page.strategicPartnerships.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Strategic partner not found');
    }

    let newImage = partner.image;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }
        await deleteFromCloud(partner.image.publicId);
        newImage = cloudResult;
    }

    if (text !== undefined) partner.text = text;
    partner.image = newImage;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
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

    await deleteFromCloud(partner.image.publicId);

    page.strategicPartnerships.pull(partnerId);
    await page.save();

    res.status(200).json({
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
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    const newMember = { image: cloudResult, name, designation };
    page.coreTeam.push(newMember);

    await page.save();
    safeCleanup(req);

    const added = page.coreTeam[page.coreTeam.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Core team member not found');
    }

    let newImage = member.image;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }
        await deleteFromCloud(member.image.publicId);
        newImage = cloudResult;
    }

    if (name !== undefined) member.name = name;
    if (designation !== undefined) member.designation = designation;
    member.image = newImage;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
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

    await deleteFromCloud(member.image.publicId);

    page.coreTeam.pull(memberId);
    await page.save();

    res.status(200).json({
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
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

    const newMember = { image: cloudResult, name, designation };
    page.supportingTeam.push(newMember);

    await page.save();
    safeCleanup(req);

    const added = page.supportingTeam[page.supportingTeam.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Supporting team member not found');
    }

    let newImage = member.image;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }
        await deleteFromCloud(member.image.publicId);
        newImage = cloudResult;
    }

    if (name !== undefined) member.name = name;
    if (designation !== undefined) member.designation = designation;
    member.image = newImage;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
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

    await deleteFromCloud(member.image.publicId);

    page.supportingTeam.pull(memberId);
    await page.save();

    res.status(200).json({
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
