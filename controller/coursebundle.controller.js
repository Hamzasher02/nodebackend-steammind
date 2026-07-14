import courseBundleModel from "../model/coursebundle.model.js";
import categoryModel from "../model/category.model.js";
import courseModel from "../model/course.model.js";
import deletionHistoryModel from "../model/deletionhistory.model.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";
import { deleteFromCloud, uploadToCloud } from "../services/cloudinary.uploader.services.js";

const createBundle = asyncWrapper(async (req, res) => {
    const adminId = req.user.userId;
    let publicIdThumbnail;

    // 1. Parse body (Handling potential stringified arrays from Multer/FormData)
    let {
        bundleName, price, category, subcategory = [],
        level = [], ageGroup, access, description,
        discount = 0, couponCode, visibility = "Active", courses = []
    } = req.body;
console.log(level);
console.log(subcategory);
console.log(courses);

    // Ensure arrays are actually arrays (Multer often parses them as strings)
    const subCatArr = Array.isArray(subcategory) ? subcategory : [subcategory];
    const levelArr = Array.isArray(level) ? level : [level];
    const coursesArr = Array.isArray(courses) ? courses : [courses];

    // 2. File Validation
    if (!req.file) throw new BAD_REQUEST("Please upload bundle thumbnail image");

    // 3. Category Validation
    const categoryData = await categoryModel.findById(category);
    console.log(categoryData);
    
    if (!categoryData) throw new NOT_FOUND("Category not found");

    if (ageGroup && !categoryData.categoryAgeGroup.includes(ageGroup))
        throw new BAD_REQUEST(`Invalid age group '${ageGroup}' for this category`);

    for (let lv of levelArr) {
        if (!categoryData.categoryLevel.includes(lv))
            throw new BAD_REQUEST(`Invalid level '${lv}' for this category`);
    }

    for (let sub of subCatArr) {
        if (!categoryData.subCategory.includes(sub))
            throw new BAD_REQUEST(`Invalid subcategory '${sub}' for this category`);
    }

    // 4. Detailed Course Validation
    for (const courseId of coursesArr) {
        const course = await courseModel.findOne({ _id: courseId, isCoursePublished: true,isDeleted:false });
        if (!course) throw new BAD_REQUEST(`Published course not found: ${courseId}`);
console.log(course);

        // FIX: toString() parentheses and logic check
        // Assuming courseCategory[0] is the main category ID
        if (!course.courseCategory.includes(categoryData.categoryName)) {
            throw new BAD_REQUEST(`Course ${course.courseTitle} does not match the category ${categoryData.categoryName}`);
        }

        if (!levelArr.includes(course.courseLevel))
            throw new BAD_REQUEST(`Course '${course.courseTitle}' level (${course.courseLevel}) not in bundle levels`);

        if (!subCatArr.includes(course.courseSubCategory))
            throw new BAD_REQUEST(`Course '${course.courseTitle}' subcategory not in bundle subcategories`);

        if (course.courseAgeGroup !== ageGroup)
            throw new BAD_REQUEST(`Course '${course.courseTitle}' age group mismatch`);
    }

    // 5. Upload and Create
    try {
        const thumbnailCloud = await uploadToCloud(req.file.path);
        publicIdThumbnail = thumbnailCloud.publicId;

        const newBundle = await courseBundleModel.create({
            thumbnail: thumbnailCloud.secureUrl, // If schema expects string, use secureUrl
            bundleName,
            price: Number(price),
            category,
            subCateogory: subCatArr, // Match schema naming "subCateogory"
            level: levelArr,
            ageGroup,
            access: Number(access),
            description,
            discount: Number(discount),
            couponCode,
            visibility,
            createdBy: adminId,
            courses: coursesArr
        });

        res.status(201).json({ success: true, message: "Bundle created", data: newBundle });
    } catch (err) {
        if (publicIdThumbnail) await deleteFromCloud(publicIdThumbnail);
        throw err;
    }
});

const getAllBundles = asyncWrapper(async (req, res) => {
    const includeDeleted = req.query.includeDeleted === "true";
    const filter = includeDeleted ? {} : { isDeleted: false };
    const bundles = await courseBundleModel.find(filter).populate("category").populate("courses");
    if (!bundles || bundles.length === 0) throw new NOT_FOUND("No bundles found");
    res.status(200).json({ success: true, total: bundles.length, data: bundles });
});

const getSingleBundle = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const bundle = await courseBundleModel.findById(id).populate("category").populate("courses");
    if (!bundle) throw new NOT_FOUND("Bundle not found");
    res.status(200).json({ success: true, data: bundle });
});

const updateBundle = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const updated = await courseBundleModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) throw new NOT_FOUND("Bundle not found");
    res.status(200).json({ success: true, message: "Bundle updated successfully", data: updated });
});

const deleteBundle = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const bundle = await courseBundleModel.findById(id);
    if (!bundle) throw new NOT_FOUND("Bundle not found");
    if (bundle.isDeleted) throw new BAD_REQUEST("Bundle already deleted");
    bundle.isDeleted = true;
    bundle.deletedAt = new Date();
    bundle.deletedBy = userId;
    bundle.restoredAt = null;
    bundle.restoredBy = null;
    await bundle.save();
    await deletionHistoryModel.create({
        itemId: bundle._id,
        itemName: bundle.bundleName,
        itemModel: "CourseBundle",
        performedBy: userId,
        affectedRefs: bundle.courses.map(c => ({ model: "Course", refId: c }))
    });
    res.status(200).json({ success: true, message: "Course bundle deleted (soft delete)" });
});

const restoreBundle = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const bundle = await courseBundleModel.findById(id);
    if (!bundle) throw new NOT_FOUND("Bundle not found");
    if (!bundle.isDeleted) throw new BAD_REQUEST("Bundle is not deleted");
    bundle.isDeleted = false;
    bundle.restoredAt = new Date();
    bundle.restoredBy = userId;
    await bundle.save();
    await deletionHistoryModel.deleteOne({ itemId: id, itemModel: "CourseBundle" });
    res.status(200).json({ success: true, message: "Course bundle restored", data: bundle });
});

export { createBundle, getAllBundles, getSingleBundle, updateBundle, deleteBundle, restoreBundle };
