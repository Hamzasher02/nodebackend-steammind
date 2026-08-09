import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";
import asyncWrapper from "../middleware/asyncWrapper.js";
import categoryModel from "../model/category.model.js";
import courseModel from "../model/course.model.js";
import deletionHistoryModel from "../model/deletionhistory.model.js";
import mongo from "mongoose";
import cleanupUploadedFiles from "../utils/cleanup.helper.utils.js";
import { deleteFromCloud, uploadToCloud } from "../services/cloudinary.uploader.services.js";

const createCategory = asyncWrapper(async (req, res) => {
    let publicid;
    let isSessionEnded = false;
    const session = await mongo.startSession();
    session.startTransaction();

    try {
        const { categoryName,categoryDescription, visibility = 'active', subCategory = [], categoryLevel = [], categoryAgeGroup = [] } = req.body;
      if(!categoryDescription)throw new BAD_REQUEST("category description is required");
        if (!categoryName) throw new BAD_REQUEST("please provide cateogry name");
        if (subCategory.length <= 0 || categoryLevel.length <= 0 || categoryAgeGroup.length <= 0) {
            throw new BAD_REQUEST("Plese provide atleast one level,age gorup and subateogry");
        }
  
        if (!req.file) throw new BAD_REQUEST("Please provide category icon");
        if (!req.file.mimetype.startsWith("image/")) {
            throw new BAD_REQUEST("Please provide valid image format.");
        }

        const iconCloud = await uploadToCloud(req.file.path);
        publicid = iconCloud.publicId;

        if (!iconCloud.publicId || !iconCloud.secureUrl) {
            throw new INTERNAL_SERVER_ERROR(
                "Unable to upload file to the server please provide a valid file"
            );
        }

        const [category] = await categoryModel.create([{
            categoryName,
            subCategory,
            categoryLevel,
            categoryAgeGroup,
            visibility,
            categoryDescription,
            icon: {
                publicId: iconCloud.publicId,
                secureUrl: iconCloud.secureUrl
            },
            createdBy: req.user.userId
        }], { session });
        await session.commitTransaction();
        session.endSession();
        isSessionEnded = true;

        cleanupUploadedFiles(req);

        res.status(201).json({
            success: true,
            message: "category created successfully.",
            data: category,
        });

    } catch (err) {
        if (isSessionEnded === false) {
            await session.abortTransaction();
            session.endSession();
        }

        if (publicid) {
            await deleteFromCloud(publicid);
        }

        throw err;
    }
});
const updateCategory = asyncWrapper(async (req, res) => {
    const {
        categoryName,
        subCategory = [],
        categoryLevel = [],
        categoryAgeGroup = [],
        categoryId,
        visibility,
        categoryDescription
    } = req.body;

    if (!categoryId) throw new BAD_REQUEST("Please provide category id");

    const category = await categoryModel.findById(categoryId);
    if (!category || category.isDeleted) {
        throw new NOT_FOUND("No category found with this id");
    }

    let newPublicId;
    const oldPublicId = category.icon?.publicId;
    const session = await mongo.startSession();
    session.startTransaction();

    try {
        if (categoryName) category.categoryName = categoryName;
        if(categoryDescription)category.categoryDescription=categoryDescription
        if (visibility) {
            category.visibility = visibility;

            await courseModel.updateMany(
                {
                    courseCategory: { $in: [category.categoryName] },
                    isDeleted: false
                },
                {
                    $set: {
                        courseVisibility: visibility === "active"
                    }
                },
                { session }
            );
        }

        if (subCategory.length > 0) {
            category.subCategory = Array.from(
                new Set([...category.subCategory, ...subCategory])
            );
        }

        if (categoryLevel.length > 0) {
            category.categoryLevel = Array.from(
                new Set([...category.categoryLevel, ...categoryLevel])
            );
        }

        if (categoryAgeGroup.length > 0) {
            category.categoryAgeGroup = Array.from(
                new Set([...category.categoryAgeGroup, ...categoryAgeGroup])
            );
        }

        if (req.file) {
            if (!req.file.mimetype.startsWith("image/")) {
                throw new BAD_REQUEST("Please provide a valid image format");
            }

            const iconCloud = await uploadToCloud(req.file.path);
            if (!iconCloud?.publicId || !iconCloud?.secureUrl) {
                throw new INTERNAL_SERVER_ERROR("Unable to upload icon");
            }

            newPublicId = iconCloud.publicId;

            category.icon = {
                publicId: iconCloud.publicId,
                secureUrl: iconCloud.secureUrl
            };
        }

        const updatedCategory = await category.save({ session });

        await session.commitTransaction();
        session.endSession();

        if (req.file && oldPublicId) {
            await deleteFromCloud(oldPublicId);
        }

        cleanupUploadedFiles(req);

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        if (newPublicId) {
            await deleteFromCloud(newPublicId);
        }

        throw err;
    }
});
// const deleteCategory = asyncWrapper(async (req, res) => {
//     const { categoryId } = req.body;
//     //check in courses if category is assigned to some course do not allow to delete it
//     //just ask admin to change the desired course category then you can delete it
//     if (!categoryId) throw new BAD_REQUEST("please provide category id");
//     const category = await categoryModel.findOne({ _id: categoryId })
//     if (!category) throw new BAD_REQUEST("No category found")
//     category.categoryStatus = false;
//     //move this category to trashmodel
//     //add affected refs 
//     //intrash its ref and model name is stored 
//     //and in affected refs in which docs it is used keys and refs also the trash ref 
//     //category courses docs will be stored in affected like this course of this category will be deleted
//     await category.save()
//     res.status(201).json({
//         success: true,
//         message: "category moved to trash successfully.",
//         data: category,
//     })
// })
const getSingleCategory = asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;
    if (!categoryId) throw new BAD_REQUEST("Please provide category id");
    const category = await categoryModel.findById(categoryId);
    if (!category || category.isDeleted == true) throw new BAD_REQUEST("No category found");
    res.status(200).json({
        success: true,
        message: "Category fetched successfully.",
        data: category
    });
});


const getAllCategories = asyncWrapper(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    let query = {
        isDeleted: false
    };

    if (status) {
        query.visibility = status;
    }

    if (search) {
        const regex = new RegExp(search, "i");
        query.$or = [
            { categoryName: regex },
            { subCategory: { $in: [regex] } },
            { categoryLevel: { $in: [regex] } },
            { categoryAgeGroup: { $in: [regex] } }
        ];
    }

    const totalCategories = await categoryModel.countDocuments(query);

    if (!totalCategories) {
        return res.status(200).json({
            success: true,
            message: "No categories found",
            data: [],
            pagination: {
                total: 0,
                page,
                limit,
                totalPages: 0
            }
        });
    }

    const categories = await categoryModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        pagination: {
            total: totalCategories,
            page,
            limit,
            totalPages: Math.ceil(totalCategories / limit)
        },
        data: categories

    });
});

const getCategoryLevels = asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;
    if (!categoryId) throw new BAD_REQUEST("Please provide category id");
    const category = await categoryModel.findById(categoryId).select("categoryLevel");
    if (!category) throw new BAD_REQUEST("No category found");
    res.status(200).json({
        success: true,
        message: "Category levels fetched.",
        data: category.categoryLevel
    });
});


const getSubCategories = asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) throw new BAD_REQUEST("Please provide category id");

    const category = await categoryModel.findById(categoryId).select("subCategory");

    if (!category) throw new BAD_REQUEST("No category found");

    res.status(200).json({
        success: true,
        message: "Sub categories fetched.",
        data: category.subCategory
    });
});
const getCategoryAgeGroups = asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) throw new BAD_REQUEST("Please provide category id");

    const category = await categoryModel.findById(categoryId).select("categoryAgeGroup");

    if (!category) throw new BAD_REQUEST("No category found");

    res.status(200).json({
        success: true,
        message: "Category age groups fetched.",
        data: category.categoryAgeGroup
    });
});
const getAllAgeGroups = asyncWrapper(async (req, res) => {
    const categories = await categoryModel.find(
        { isDeleted: false });

    if (!categories.length) {
        throw new BAD_REQUEST("No categories found");
    }

    const allAgeGroups = [
        ...new Set(categories.flatMap(cat => cat.categoryAgeGroup || []))
    ];

    res.status(200).json({
        success: true,
        message: "All age groups fetched successfully.",
        data: allAgeGroups
    });
});

const deleteCategory = asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;
    const adminId = req.user.userId;
    if (!categoryId) throw new BAD_REQUEST("Please provide category id");
    const category = await categoryModel.findById(categoryId);
    if (!category || category.isDeleted === true) {
        throw new NOT_FOUND("No active category found");
    }
    const linkedCourses = await courseModel.find({
        courseCategory: category.categoryName
    }).select('courseTitle');

    if (linkedCourses.length > 0) {
        const courseTitles = linkedCourses.map(c => c.courseTitle);

        return res.status(400).json({
            success: false,
            message: `can not delete categoryas it contains ${linkedCourses.length} active courses`,
            data: courseTitles
        });
    }
    category.isDeleted = true;
    category.deletedAt = new Date();
    category.deletedBy = adminId;
    await category.save();
    await deletionHistoryModel.create({
        itemId: category._id,
        itemName: category.categoryName,
        itemModel: "Category",
        performedBy: adminId,
        affectedRefs: [],
    });

    res.status(200).json({
        success: true,
        message: "Category moved to trash successfully.",
        data: []
    });
});
const deleteCategoryPermanently = asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) throw new BAD_REQUEST("Please provide category id");

    const category = await categoryModel.findById(categoryId);

    if (!category || category.isDeleted === false) {
        throw new BAD_REQUEST("Category must be moved to trash before permanent deletion");
    }
    const history = await deletionHistoryModel.findOne({
        itemId: categoryId,
        itemModel: "Category"
    });
    if (!history) {
        throw new NOT_FOUND("No deletion history found for this category");
    }
    if (category.icon && category.icon.publicId) {
        await deleteFromCloud(category.icon.publicId);
    }
    await categoryModel.findByIdAndDelete(categoryId);

    await deletionHistoryModel.findByIdAndDelete(history._id);

    res.status(200).json({
        success: true,
        message: "category and associated assets permanently deleted from system",
        data: []
    });
});

const restoreCategory = asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;
    const adminId = req.user.userId;
    if (!categoryId) throw new BAD_REQUEST("Please provide category id");
    const category = await categoryModel.findById(categoryId);
    if (!category || category.isDeleted === false) {
        throw new NOT_FOUND("Category not found in trash");
    }
    category.isDeleted = false;
    category.restoredAt = new Date();
    category.restoredBy = adminId;
    category.deletedAt = null;
    category.deletedBy = null;

    await category.save();
    await deletionHistoryModel.findOneAndDelete({
        itemId: categoryId,
        itemModel: "Category"
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Category restored successfully.",
        data: [category]
    });
});


export { createCategory, updateCategory, getSingleCategory, getAllCategories, getCategoryAgeGroups, getSubCategories, getCategoryLevels, deleteCategory, restoreCategory, getAllAgeGroups, deleteCategoryPermanently }