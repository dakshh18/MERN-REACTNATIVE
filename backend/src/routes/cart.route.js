import { Router } from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from '../controllers/cart.controller.js';
import {
    addToCartSchema,
    updateCartItemSchema,
    productIdParamSchema,
} from '../schemas/cart.schema.js';


const router = Router();

router.use(protectRoute);

router.get("/", getCart);
router.post("/", validate(addToCartSchema), addToCart);
router.put("/:productId", validate(updateCartItemSchema), updateCartItem);
router.delete("/:productId", validate(productIdParamSchema), removeFromCart);
router.delete("/", clearCart);


export default router;