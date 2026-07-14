import { StatusCodes } from "http-status-codes";
import asyncWrapper from "../middleware/asyncWrapper.js";
import cartModel from "../model/cart.model.js";
import courseModel from "../model/course.model.js";
import { BAD_REQUEST, NOT_FOUND } from "../error/error.js";

const PURCHASE_TYPES = ['Live Classes', 'Recorded Lectures'];

const parseCoursePrice = (course) => {
    const price = Number(course.coursePrice);
    if (Number.isNaN(price)) {
        throw new BAD_REQUEST("Course price is invalid for this course");
    }
    return price;
};

const recalcCartTotals = (cart) => {
    const totals = cart.items.reduce(
        (acc, item) => {
            acc.totalItems += item.quantity;
            acc.totalAmount += item.quantity * item.price;
            return acc;
        },
        { totalItems: 0, totalAmount: 0 }
    );
    cart.totalItems = totals.totalItems;
    cart.totalAmount = totals.totalAmount;
};

// Add or increment course in cart


// Get my cart
const getMyCart = asyncWrapper(async (req, res) => {
    const userId = req.user.userId;

    const cart = await cartModel
        .findOne({ user: userId })
        .populate('items.course', 'courseTitle courseThumbnail courseCategory courseSubCategory courseLevel courseAgeGroup');

    if (!cart || cart.items.length === 0) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cart is empty",
            data: {
                items: [],
                totalItems: 0,
                totalAmount: 0
            }
        });
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Cart retrieved successfully",
        data: cart
    });
});

// ... helper functions (parseCoursePrice, recalcCartTotals) remain the same

const addToCart = asyncWrapper(async (req, res) => {
    const { courseId, purchaseType = 'Live Classes', quantity = 1 } = req.body;
    const userId = req.user.userId;

    const course = await courseModel.findOne({ _id: courseId, isDeleted: false });
    if (!course) throw new NOT_FOUND("Course not found or has been deleted");
    if (!course.isCoursePublished) throw new BAD_REQUEST("Course is not published");

    const price = parseCoursePrice(course);

    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
        cart = await cartModel.create({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
        (item) => item.course.toString() === courseId && item.purchaseType === purchaseType
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            course: courseId,
            purchaseType,
            quantity,
            price,
            courseTitle: course.courseTitle,
            courseThumbnail: course.courseThumbnail
        });
    }

    recalcCartTotals(cart);
    await cart.save();
    const populatedCart = await cartModel.findOne({ user: userId })
        .populate('items.course', 'courseTitle courseThumbnail courseCategory courseSubCategory courseLevel courseAgeGroup');

    res.status(StatusCodes.OK).json({ success: true, data: populatedCart });
});

const updateQuantity = asyncWrapper(async (req, res) => {
    const { itemId } = req.params; 
    const { quantity } = req.body;
    const userId = req.user.userId;

    if (quantity < 1) throw new BAD_REQUEST("Quantity must be at least 1");

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) throw new NOT_FOUND("Cart not found");

    const item = cart.items.id(itemId);
    if (!item) throw new NOT_FOUND("Item not found in cart");

    item.quantity = quantity;

    recalcCartTotals(cart);
    await cart.save();

    const populatedCart = await cartModel.findOne({ user: userId })
        .populate('items.course', 'courseTitle courseThumbnail courseCategory courseSubCategory courseLevel courseAgeGroup');

    res.status(StatusCodes.OK).json({ success: true, data: populatedCart });
});

const removeItem = asyncWrapper(async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user.userId;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) throw new NOT_FOUND("Cart not found");

    const item = cart.items.id(itemId);
    if (!item) throw new NOT_FOUND("Item not found");
    
    cart.items.pull(itemId); 

    recalcCartTotals(cart);
    await cart.save();

    const populatedCart = await cartModel.findOne({ user: userId })
        .populate('items.course', 'courseTitle courseThumbnail courseCategory courseSubCategory courseLevel courseAgeGroup');

    res.status(StatusCodes.OK).json({ success: true, data: populatedCart });
});

// Clear cart
const clearCart = asyncWrapper(async (req, res) => {
    const userId = req.user.userId;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cart cleared successfully",
            data: { items: [], totalItems: 0, totalAmount: 0 }
        });
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;

    await cart.save();

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Cart cleared successfully",
        data: cart
    });
});

export {
    addToCart,
    getMyCart,
    updateQuantity,
    removeItem,
    clearCart
};
