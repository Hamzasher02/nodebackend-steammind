import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import courseModel from "../model/course.model.js";
import { deleteFromCloud, uploadToCloud } from "../services/cloudinary.uploader.services.js";
import categoryModel from "../model/category.model.js";
import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";
import instructorModel from "../model/instructor.model.js";
import courseLearningOutcomeModel from "../model/learningoutcome.model.js";
import courseModuleModel from "../model/coursemodule.model.js";
import userModel from "../model/user.model.js";
import courseLectureModel from "../model/courselecture.model.js";
import pdfMaterialModel from "../model/coursepdfmaterials.model.js";
import courseBundleModel from "../model/coursebundle.model.js";
const createCourse = asyncWrapper(async (req, res) => {
    console.log(req.body);

    const {
        courseTitle,
        courseCategory,
        courseSubCategory,
        courseAgeGroup,
        courseLevel,
        courseAccess,
        coursePrice,
        courseEnrollementType
    } = req.body
    let publicIdCourseOutline;
    let publicIdCourseThumnail;

    const isCourseExist = await courseModel.findOne({ courseTitle })
    if (isCourseExist) throw new BAD_REQUEST("Course names can not be same")

    if (!req.files || req.files.length < 2) {
        throw new BAD_REQUEST("Please provide both courseThumbnail (image) and courseOutline (PDF)");
    }

    let courseThumbnail, courseOutline;

    for (const file of req.files) {
        if (file.mimetype.startsWith("image/")) {
            courseThumbnail = file;
        } else if (file.mimetype === "application/pdf") {
            courseOutline = file;
        }
    }

    if (!courseThumbnail) {
        throw new BAD_REQUEST("courseThumbnail image is required (jpg, png, etc.)");
    }
    if (!courseOutline) {
        throw new BAD_REQUEST("courseOutline PDF is required");
    }


    if (courseThumbnail.size > 1 * 1024 * 1024) {
        throw new BAD_REQUEST("courseThumbnail image size must not exceed 1 MB");
    }
    if (courseOutline.size > 10 * 1024 * 1024) {
        throw new BAD_REQUEST("courseOutline PDF size must not exceed 10 MB");
    }
    const isCategoryExist = await categoryModel.findOne({ categoryName: courseCategory });
    if (!isCategoryExist) throw new NOT_FOUND("No category exist with this name")
    if (!isCategoryExist.subCategory.includes(courseSubCategory)) {
        throw new BAD_REQUEST("Subcategory does not belong to this category");
    }

    if (!isCategoryExist.categoryLevel.includes(courseLevel)) {
        throw new BAD_REQUEST("Level does not belong to this category");
    }

    if (!isCategoryExist.categoryAgeGroup.includes(courseAgeGroup)) {
        throw new BAD_REQUEST("Age group does not belong to this category");
    }
    try {
        const courseThumbnailCloud = await uploadToCloud(courseThumbnail.path)
        const courseOutlineCloud = await uploadToCloud(courseOutline.path)
        publicIdCourseThumnail = courseThumbnailCloud.publicId  //incase creation failed so we can delete from cloud
        publicIdCourseOutline = courseOutlineCloud.publicId
        if (!publicIdCourseThumnail || !publicIdCourseOutline) {
            throw new INTERNAL_SERVER_ERROR("Unable to upload file to the server. Please provide valid files.");
        }
        const courseThumbnailData = { ...courseThumbnailCloud }
        const courseOutlineData = { ...courseOutlineCloud }
        const course = await courseModel.create({
            courseTitle,
            courseCategory,
            courseSubCategory,
            courseAgeGroup,
            courseLevel,
            courseAccess: courseAccess !== undefined ? courseAccess : null,
            coursePrice,
            courseOutline: courseOutlineData,
            courseThumbnail: courseThumbnailData,
            createdBy: req.user.userId,
            courseEnrollementType
        });
        cleanupUploadedFiles(req)
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Course created successfully",
            data: [course]

        })
    } catch (err) {
        if (publicIdCourseOutline) await deleteFromCloud(publicIdCourseOutline);
        if (publicIdCourseThumnail) await deleteFromCloud(publicIdCourseThumnail);
        throw err
    }
})
const getAllCoursesUserSide = asyncWrapper(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const {
        search,
        category,
        ageGroup,
        level,
        courseEnrollementType
    } = req.query;

    const filter = { isDeleted: false, isCoursePublished: true, courseVisibility: true };
    if (search) {
        filter.courseTitle = { $regex: search, $options: "i" };
    }

    if (category) {
        filter.courseCategory = { $in: [category] };
    }

    if (ageGroup) {
        filter.courseAgeGroup = ageGroup;
    }

    if (level) {
        filter.courseLevel = level;
    }

    if (courseEnrollementType) {
        //live or recorded
        filter.courseEnrollementType = courseEnrollementType;
    }

    const totalCourses = await courseModel.countDocuments(filter);

    if (!totalCourses) {
        throw new NOT_FOUND("No courses found");
    }

    const allCourses = await courseModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Courses fetched successfully",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCourses / limit),
            totalCourses,
            limit
        },
        data: allCourses
    });
});


const getAllCoursesAdminSideWhileCreatingBundle = asyncWrapper(async (req, res) => {
    const { category, subCategory, ageGroup, level } = req.query;

    let queryObj = {
        isCoursePublished: true,
        courseVisibility: true,
        isDeleted: false 
    };

    if (category) {
        queryObj.courseCategory = category; 
    }

    if (subCategory) {
        queryObj.courseSubCategory = subCategory;
    }

    if (ageGroup) {
        queryObj.courseAgeGroup = ageGroup;
    }

    if (level) {
        queryObj.courseLevel = level;
    }

    const allCourses = await courseModel
        .find(queryObj)
        .select('courseTitle courseCategory courseSubCategory courseAgeGroup courseLevel coursePrice courseThumbnail courseEnrollementType')
        .sort({ createdAt: -1 });

    if (!allCourses || allCourses.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "No courses found matching the selected filters",
            data: []
        });
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Courses retrieved successfully",
        count: allCourses.length,
        data: allCourses
    });
});
const getAdminCatalog = asyncWrapper(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const {
        type = "all",
        search,
        category,
        status,
        priceMin,
        priceMax
    } = req.query;

    const courseFilter = { isDeleted: false };
    const bundleFilter = { isDeleted: false };

    if (search) {
        courseFilter.courseTitle = { $regex: search, $options: "i" };
        bundleFilter.bundleName = { $regex: search, $options: "i" };
    }

    if (category) {
        courseFilter.courseCategory = { $in: [category] };
        bundleFilter.category = category;
    }

    if (status) {
        courseFilter.isCoursePublished = status === "Published";
        bundleFilter.visibility = status;
    }

    if (priceMin || priceMax) {
        bundleFilter.priceAfterDiscount = {};
        if (priceMin) bundleFilter.priceAfterDiscount.$gte = Number(priceMin);
        if (priceMax) bundleFilter.priceAfterDiscount.$lte = Number(priceMax);
    }
    let courses = [];
    let bundles = [];
    let totalCourses = 0;
    let totalBundles = 0;

    const tasks = [];

    if (type === "all" || type === "course") {
        tasks.push(
            courseModel.find(courseFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .then(res => courses = res),
            courseModel.countDocuments(courseFilter)
                .then(res => totalCourses = res)
        );
    }

    if (type === "all" || type === "bundle") {
        tasks.push(
            courseBundleModel.find(bundleFilter)
                .populate("category")
                .populate("courses")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .then(res => bundles = res),
            courseBundleModel.countDocuments(bundleFilter)
                .then(res => totalBundles = res)
        );
    }

    await Promise.all(tasks);

    res.status(StatusCodes.OK).json({
        success: true,
        type,
        pagination: {
            page,
            limit,
            totalCourses: type === "bundle" ? 0 : totalCourses,
            totalBundles: type === "course" ? 0 : totalBundles,
            totalResults: (type === "course" ? totalCourses : type === "bundle" ? totalBundles : (totalCourses + totalBundles))
        },
        data: {
            courses,
            bundles
        }
    });
});

const getSingleCourseUserSide = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;

    if (!courseId) throw new BAD_REQUEST("Course ID is required");

    const course = await courseModel.findOne({ 
        _id: courseId, 
        isCoursePublished: true,
        isDeleted: false 
    })
    .populate({
        path: 'assignedInstructors.instructor',
        select: 'firstName lastName profilePicture' 
    })
    .select('-isDeleted -deletedAt -deletedBy -restoredAt -restoredBy -createdBy -courseVisibility');

    if (!course) throw new NOT_FOUND("Course not found or not published.");

 
    const formattedCourse = course.toObject();
    
    if (formattedCourse.assignedInstructors) {
        formattedCourse.instructors = formattedCourse.assignedInstructors.map(item => ({
            _id: item.instructor._id,
            name: `${item.instructor.firstName} ${item.instructor.lastName}`,
            profilePicture: item.instructor.profilePicture?.secureUrl
        }));
        delete formattedCourse.assignedInstructors;
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course details retrieved successfully",
        data: formattedCourse
    });
});
const getSingleCourseAdminSide = asyncWrapper(async (req, res) => {
    //admin autorization middl
    const { courseId } = req.params
    if (!courseId) throw new BAD_REQUEST("course is is required")
    const course = await courseModel.findOne({ _id: courseId })
    if (!course) throw new NOT_FOUND("no course exist")
    res.status(StatusCodes.OK).json({
        success: true,
        message: "All courser successfully",
        data: [course]
    })
})
const updateCourseBasicInformation = asyncWrapper(async (req, res) => {
    let publicIdThumbnailToDelete = null;
    let publicIdOutlineToDelete = null;
    let updateObject = {};

    const {
        courseTitle,
        courseCategory,
        courseSubCategory,
        courseAgeGroup,
        courseLevel,
        courseAccess,
        coursePrice,
        courseDescription,
        courseDuration,
        coursePrerequisite,
        courseTargetAudience,
    } = req.body;

    if (courseTitle) updateObject.courseTitle = courseTitle;
    if (courseCategory) updateObject.courseCategory = courseCategory;
    if (courseSubCategory) updateObject.courseSubCategory = courseSubCategory;
    if (courseAgeGroup) updateObject.courseAgeGroup = courseAgeGroup;
    if (courseLevel) updateObject.courseLevel = courseLevel;
    if (courseAccess) updateObject.courseAccess = courseAccess;
    if (coursePrice) updateObject.coursePrice = coursePrice;
    if (courseDescription || courseDuration || coursePrerequisite || courseTargetAudience) {
        updateObject.courseOverview = {
            courseDescription: courseDescription ?? null,
            courseDuration: courseDuration ?? null,
            coursePrerequisite: coursePrerequisite ?? null,
            courseTargetAudience: courseTargetAudience ?? null,
        };
    }

    const course = await courseModel.findById(req.params.courseId);
    if (!course) throw new NOT_FOUND("No course found with this ID");

    if (courseCategory || courseSubCategory || courseLevel || courseAgeGroup) {
        const category = await categoryModel.findOne({ categoryName: courseCategory || course.courseCategory });
        if (!category) throw new NOT_FOUND("No category found with this name");

        if (courseSubCategory && !category.subCategory.includes(courseSubCategory)) {
            throw new BAD_REQUEST("Subcategory does not belong to this category");
        }
        if (courseLevel && !category.categoryLevel.includes(courseLevel)) {
            throw new BAD_REQUEST("Level does not belong to this category");
        }
        if (courseAgeGroup && !category.categoryAgeGroup.includes(courseAgeGroup)) {
            throw new BAD_REQUEST("Age group does not belong to this category");
        }
    }

    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            if (file.mimetype.startsWith("image/")) {
                if (file.size > 1 * 1024 * 1024) {
                    throw new BAD_REQUEST("courseThumbnail image must not exceed 1 MB");
                }
                const thumbnailCloud = await uploadToCloud(file.path);
                updateObject.courseThumbnail = { ...thumbnailCloud };
                publicIdThumbnailToDelete = course.courseThumbnail?.publicId;
            } else if (file.mimetype === "application/pdf") {
                if (file.size > 10 * 1024 * 1024) {
                    throw new BAD_REQUEST("courseOutline PDF must not exceed 10 MB");
                }
                const outlineCloud = await uploadToCloud(file.path);
                updateObject.courseOutline = { ...outlineCloud };
                publicIdOutlineToDelete = course.courseOutline?.publicId;
            } else {
                throw new BAD_REQUEST("Invalid file type. Only image and PDF files are allowed.");
            }
        }
    }

    if (Object.keys(updateObject).length === 0) {
        throw new BAD_REQUEST("Please provide at least one field to update");
    }

    const updatedCourse = await courseModel.findByIdAndUpdate(
        course._id,
        updateObject,
        { new: true, runValidators: true }
    );

    if (publicIdThumbnailToDelete) await deleteFromCloud(publicIdThumbnailToDelete);
    if (publicIdOutlineToDelete) await deleteFromCloud(publicIdOutlineToDelete);
    cleanupUploadedFiles(req);

    res.status(StatusCodes.OK).json({
        success: true,
        message: "course updated successfully",
        data: [updatedCourse]
    });
});


const publishCourse = asyncWrapper(async (req, res) => {
    //save draft so front end dev will keep track of all the data in store and upon savedraft frontend will start making requests to the backend and in case of publish course it will make request to change the visibility of the course .
    //keep publish course like if admin only want to set the visibility to true so in that case publish course will set the course visibility to true and set publish course to true 
    //check condtions conditions avoid  
    //always set the course visibility to true if course publish pre conditions met
    const { courseId } = req.params;
    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("course not found");
    const totalOutcomes = await courseLearningOutcomeModel.countDocuments({ belongTo: courseId });
    if (totalOutcomes < 3)
        throw new BAD_REQUEST("you cannot publish the course until you have 3 or more learning outcomes");
    const totalModules = await courseModuleModel.countDocuments({ moduleCourse: courseId });
    if (totalModules < 1)
        throw new BAD_REQUEST("you cannot publish the course until you have at least one module");
    const overview = course.courseOverview;
    if (!overview.courseDescription || !overview.courseDuration || !overview.coursePrerequisite || !overview.courseTargetAudience) {
        throw new BAD_REQUEST("course Overview is incomplete please fill all overview fields before publishing");
    }
    course.isCoursePublished = true;
    course.courseVisibility = true;
    await course.save();
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course published/visible now",
        data: [course],
    });
});
const toggleCourseVisibility = asyncWrapper(async (req, res) => {
    //this apis is for to toggle b/w both 
    const { courseId } = req.params;

    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found");

    //to avoid condtion here like weather the courses data is complete or not i have added this isCoursepublish thing 
    //conditions ab nh check krni already ho gayi
    if (!course.isCoursePublished)
        throw new BAD_REQUEST("Course is not published. Please publish it first.");

    course.courseVisibility = !course.courseVisibility;
    await course.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course visibility changed successfully",
        data: [course],
    });
});

const assignInstructorToACourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const { instructorId } = req.body
    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found");
    const user = await userModel.findOne({ _id: instructorId })
    if (!user) throw new NOT_FOUND("Instructor not found");
    const instructor = await instructorModel.findOne({ createdBy: user._id })
    if (!instructor) throw new BAD_REQUEST("This id doesnot belong to instructor");
    const courseInstructors = course.assignedInstructors.map((instructor) => instructor.instructor?.toString()).filter(Boolean)
    if (courseInstructors.includes(instructorId)) throw new BAD_REQUEST("Instructor is already assigned");
    course.assignedInstructors.push({
        instructor: instructorId,
        assignedBy: req.user.userId,
        assignedAt: Date.now()
    })
    await course.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: `Instructor ${instructorId} assigned successfully`,
        data: [course],
    });
});
const removeAssignedInstructor = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const { instructorId } = req.body
    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found");
    const user = await userModel.findOne({ _id: instructorId })
    if (!user) throw new NOT_FOUND("Instructor not found");

    const instructor = await instructorModel.findOne({ createdBy: user._id })
    if (!instructor) throw new BAD_REQUEST("This id doesnot belong to instructor");
    let courseInstructors = course.assignedInstructors.map((instructor) => instructor.instructor?.toString()).filter(Boolean)
    if (!courseInstructors.includes(instructorId)) throw new BAD_REQUEST("Instructor is not assigned to a course");
    //deletion history ill add later logic here 
    course.assignedInstructors = course.assignedInstructors.filter((instructor) => instructor.instructor?.toString() !== instructorId)
    await course.save()
    res.status(StatusCodes.OK).json({
        success: true,
        message: `Instructor ${instructorId} removed successfully`,
        data: [course],
    });
});
const deleteCourse = asyncWrapper(async (req, res) => {
    //now as new logic so wrting again that controller discussed with sir hamza mam rafiah.
    // const { courseId } = req.params;
    // const course = await courseModel.findById(courseId);
    // if (!course) throw new NOT_FOUND("Course not found");
    // const lectures = await courseLectureModel.find({ lectureCourse: courseId })
    // for (let lecture of lectures) {
    //     await deleteFromCloud(lecture.lectureInfo.publicId)
    // }
    // const pdfs = await pdfMaterialModel.find({ pdfCourse: courseId })
    // for (let pdf of pdfs) {
    //     await deleteFromCloud(pdf.pdfMaterialInfo.publicId)
    // }
    // await courseLectureModel.deleteMany({ lectureCourse: courseId })
    // await pdfMaterialModel.deleteMany({ pdfCourse: courseId })
    // await courseLearningOutcomeModel.deleteMany({ belongTo: courseId })
    // await courseModuleModel.deleteMany({ moduleCourse: courseId })
    // await course.deleteOne()
    // res.status(StatusCodes.OK).json({
    //     success: true,
    //     message: `Course Deleted successfully`,
    //     data: course,
    // });
    const { courseId } = req.params;

    const course = await courseModel.findById(courseId);
    if (!course) throw new NOT_FOUND("Course not found");

    // Soft-delete course
    course.isDeleted = true;
    course.deletedAt = new Date();
    course.deletedBy = req.user.userId;
    await course.save();

    // Soft-delete lectures
    await courseLectureModel.updateMany(
        { lectureCourse: courseId },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: req.user.userId
            }
        }
    );

    await pdfMaterialModel.updateMany(
        { pdfCourse: courseId },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: req.user.userId
            }
        }
    );

    await courseModuleModel.updateMany(
        { moduleCourse: courseId },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: req.user.userId
            }
        }
    );

    await courseLearningOutcomeModel.updateMany(
        { belongTo: courseId },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: req.user.userId
            }
        }
    );

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Course moved to trash successfully",
        data: [course],
    });
});
const getCourseCompletion = async (req, res, next) => {
    const { courseId } = req.params;
    if (!courseId) throw new BAD_REQUEST("Course ID is required");
    const course = await courseModel.findById(courseId).lean();
    if (!course) throw new NOT_FOUND("Course not found");
    const requiredFields = [
        "title",
        "description",
        "objectives",
        "requirements",
        "thumbnail",
        "category",
        "instructors",
        "modules",
        "price",
        "duration",
        "level",
        "schedule"
    ];
    let filledFields = 0;
    const missingFields = [];
    requiredFields.forEach(field => {
        const value = course[field];
        if (value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)) {
            filledFields++;
        } else {
            missingFields.push(field);
        }
    });
    const totalFields = requiredFields.length;
    const completionPercentage = Math.round((filledFields / totalFields) * 100);
    return res.status(200).json({
        success: true,
        message: "Course completion",
        data: [{
            courseId: course._id,
            completionPercentage,
            filledFields,
            totalFields,
            remainingFields: missingFields.length,
            missingFields,
            requiredFields
        }], 
    });

};
export { createCourse, getAllCoursesAdminSideWhileCreatingBundle, getAllCoursesUserSide, getSingleCourseAdminSide, getSingleCourseUserSide, updateCourseBasicInformation, toggleCourseVisibility, publishCourse, assignInstructorToACourse, removeAssignedInstructor, deleteCourse, getCourseCompletion, getAdminCatalog }