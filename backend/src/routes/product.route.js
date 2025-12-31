import { Router } from 'express';
import { getAllProducts } from '../controllers/admin.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { getProductById } from '../controllers/product.controller.js';

const router = Router();


router.get("/", protectRoute, getAllProducts);
router.get("/:id", protectRoute, getProductById);
export default router;