import express from 'express';
import {
    addToCart,
    getMyCart,
    updateQuantity,
    removeItem,
    clearCart
} from '../controller/cart.controller.js';
import authenticationMiddleware from '../middleware/authentication.middleware.js';
import roleAuthorizationMiddleware from '../middleware/authorization.middleware.js';
import { validationMiddleware } from '../services/auth.validator.services.js';
import {
    addToCartValidator,
    updateQuantityValidator,
    removeItemValidator
} from '../services/cart.validator.services.js';
import activityLogger from '../middleware/activitylogger.middleware.js';

const router = express.Router();

router.post(
    '/add',
    addToCartValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger("CART", "Add to cart"),
    addToCart
);

router.get(
    '/my',
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger("CART", "Get my cart"),
    getMyCart
);

router.patch(
    '/updateQuantity/:itemId',
    updateQuantityValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger("CART", "Update cart quantity"),
    updateQuantity
);

router.delete(
    '/remove/:itemId',
    removeItemValidator(),
    validationMiddleware,
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger("CART", "Remove cart item"),
    removeItem
);

router.delete(
    '/clear',
    authenticationMiddleware,
    roleAuthorizationMiddleware('student'),
    activityLogger("CART", "Clear cart"),
    clearCart
);

export default router;
