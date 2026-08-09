import cleanupUploadedFiles, {
    handleCloudinaryUpload
} from '../utils/cleanup.helper.utils.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import coursesPageModel from '../model/coursespage.model.js';
import { StatusCodes } from 'http-status-codes';

// Helper to get or create the courses page CMS document
async function getOrCreateCoursesPage() {
    let page = await coursesPageModel.findOne();
    if (!page) {
        page = await coursesPageModel.create({
            section1: { heading: '', subHeading: '', backgroundImage: null }
        });
    }
    return page;
}

// 1. Get Courses Page CMS Content (Hero Banner)
const getCoursesPage = asyncWrapper(async (req, res) => {
    const page = await getOrCreateCoursesPage();
    res.status(StatusCodes.OK).json({
        success: true,
        data: page
    });
});

// 2. Update Section 1 Header Banner
const updateSection1 = asyncWrapper(async (req, res) => {
    const { heading, subHeading } = req.body;
    const page = await getOrCreateCoursesPage();

    let newImage = page.section1.backgroundImage;

    if (req.file) {
        newImage = await handleCloudinaryUpload(req, req.file, page.section1.backgroundImage?.publicId);
    }

    if (heading !== undefined) page.section1.heading = heading;
    if (subHeading !== undefined) page.section1.subHeading = subHeading;
    page.section1.backgroundImage = newImage;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Section 1 updated successfully',
        data: page.section1
    });
});

export {
    getCoursesPage,
    updateSection1
};


