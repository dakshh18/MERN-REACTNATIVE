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
const router = Router();

router.use(protectRoute);

// address routes 
router.post("/addresses", addAddress);
router.get("/addresses", getAddresses);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

// wishlist routes
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);
router.get("/wishlist", getWishlist);

// push notification token
router.post("/push-token", registerPushToken);

export default router;