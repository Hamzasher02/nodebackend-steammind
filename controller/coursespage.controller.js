import cleanupUploadedFiles, {
    handleCloudinaryUpload
} from '../utils/cleanup.helper.utils.js';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import coursesPageModel from '../model/coursespage.model.js';
import { deleteFromCloud } from '../services/cloudinary.uploader.services.js';
import { StatusCodes } from 'http-status-codes';

// Helper to get or create the courses page document
async function getOrCreateCoursesPage() {
    let page = await coursesPageModel.findOne();
    if (!page) {
        page = await coursesPageModel.create({
            section1: { heading: '', subHeading: '', backgroundImage: null },
            courses: []
        });
    }
    return page;
}

// 1. Get Courses Page Content
const getCoursesPage = asyncWrapper(async (req, res) => {
    const page = await getOrCreateCoursesPage();
    res.status(StatusCodes.OK).json({
        success: true,
        data: page
    });
});

// 2. Update Section 1
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

// 3. Add Promotional Course
const addCourse = asyncWrapper(async (req, res) => {
    const { title, description, ageGroup, duration, lessons, activities } = req.body;

    if (!req.file) {
        throw new BAD_REQUEST('Course thumbnail is required');
    }

    const page = await getOrCreateCoursesPage();
    const cloudResult = await handleCloudinaryUpload(req, req.file);

    const newCourse = {
        thumbnail: cloudResult,
        title,
        description,
        ageGroup,
        duration,
        lessons,
        activities
    };

    page.courses.push(newCourse);
    await page.save();
    cleanupUploadedFiles(req);

    const addedCourse = page.courses[page.courses.length - 1];

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Course added to CMS page successfully',
        data: addedCourse
    });
});

// 4. Update Promotional Course
const updateCourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, ageGroup, duration, lessons, activities } = req.body;

    const page = await getOrCreateCoursesPage();
    const course = page.courses.id(courseId);

    if (!course) {
        cleanupUploadedFiles(req);
        throw new NOT_FOUND('Course not found on CMS page');
    }

    let newThumbnail = course.thumbnail;
    if (req.file) {
        newThumbnail = await handleCloudinaryUpload(req, req.file, course.thumbnail.publicId);
    }

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (ageGroup !== undefined) course.ageGroup = ageGroup;
    if (duration !== undefined) course.duration = duration;
    if (lessons !== undefined) course.lessons = lessons;
    if (activities !== undefined) course.activities = activities;
    course.thumbnail = newThumbnail;

    await page.save();
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Course updated successfully',
        data: course
    });
});

// 5. Delete Promotional Course
const deleteCourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    const page = await getOrCreateCoursesPage();
    const course = page.courses.id(courseId);

    if (!course) {
        throw new NOT_FOUND('Course not found on CMS page');
    }

    // Delete thumbnail from Cloudinary
    try {
        await deleteFromCloud(course.thumbnail.publicId);
    } catch (error) {
        console.error("Non-blocking error deleting course thumbnail from Cloudinary:", error);
    }

    // Remove from array
    page.courses.pull(courseId);
    await page.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Course deleted from CMS page successfully'
    });
});

export {
    getCoursesPage,
    updateSection1,
    addCourse,
    updateCourse,
    deleteCourse
};
