import { Router } from 'express';
import {
    addAddress,
    addToWishlist,
    deleteAddress,
    getAddresses,
    getWishlist,
    registerPushToken,
    removeFromWishlist,
    updateAddress
} from '../controllers/user.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    addAddressSchema,
    updateAddressSchema,
    addressIdParamSchema,
    addToWishlistSchema,
    wishlistProductIdParamSchema,
    registerPushTokenSchema,
} from '../schemas/user.schema.js';

const router = Router();

router.use(protectRoute);

// address routes
router.post("/addresses", validate(addAddressSchema), addAddress);
router.get("/addresses", getAddresses);
router.put("/addresses/:addressId", validate(updateAddressSchema), updateAddress);
router.delete("/addresses/:addressId", validate(addressIdParamSchema), deleteAddress);

// wishlist routes
router.post("/wishlist", validate(addToWishlistSchema), addToWishlist);
router.delete("/wishlist/:productId", validate(wishlistProductIdParamSchema), removeFromWishlist);
router.get("/wishlist", getWishlist);

// push notification token
router.post("/push-token", validate(registerPushTokenSchema), registerPushToken);

export default router;