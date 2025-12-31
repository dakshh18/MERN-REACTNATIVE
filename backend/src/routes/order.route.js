import { Router } from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = Router();

router.post("/", protectRoute, createOrder);
router.get("/", protectRoute, getOrders);

export default router;