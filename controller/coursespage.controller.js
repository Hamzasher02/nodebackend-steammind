import fs from 'fs';
import { BAD_REQUEST, NOT_FOUND } from '../error/error.js';
import asyncWrapper from '../middleware/asyncWrapper.js';
import coursesPageModel from '../model/coursespage.model.js';
import { deleteFromCloud, uploadToCloud } from '../services/cloudinary.uploader.services.js';

// Safe cleanup function to remove local uploads
function safeCleanup(req) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
}

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
    res.status(200).json({
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
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        // Delete old image if it exists
        if (page.section1.backgroundImage?.publicId) {
            await deleteFromCloud(page.section1.backgroundImage.publicId);
        }
        newImage = cloudResult;
    }

    if (heading !== undefined) page.section1.heading = heading;
    if (subHeading !== undefined) page.section1.subHeading = subHeading;
    page.section1.backgroundImage = newImage;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
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
    let cloudResult;

    try {
        cloudResult = await uploadToCloud(req.file.path);
    } catch (err) {
        safeCleanup(req);
        throw err;
    }

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
    safeCleanup(req);

    const addedCourse = page.courses[page.courses.length - 1];

    res.status(201).json({
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
        safeCleanup(req);
        throw new NOT_FOUND('Course not found on CMS page');
    }

    let newThumbnail = course.thumbnail;
    if (req.file) {
        let cloudResult;
        try {
            cloudResult = await uploadToCloud(req.file.path);
        } catch (err) {
            safeCleanup(req);
            throw err;
        }

        // Delete old thumbnail from Cloudinary
        await deleteFromCloud(course.thumbnail.publicId);
        newThumbnail = cloudResult;
    }

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (ageGroup !== undefined) course.ageGroup = ageGroup;
    if (duration !== undefined) course.duration = duration;
    if (lessons !== undefined) course.lessons = lessons;
    if (activities !== undefined) course.activities = activities;
    course.thumbnail = newThumbnail;

    await page.save();
    safeCleanup(req);

    res.status(200).json({
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
    await deleteFromCloud(course.thumbnail.publicId);

    // Remove from array
    page.courses.pull(courseId);
    await page.save();

    res.status(200).json({
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
