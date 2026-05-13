import { Router } from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { createOrder, createPaymentIntent, getOrders } from '../controllers/order.controller.js';

const router = Router();

router.post("/", protectRoute, createOrder);
router.get("/", protectRoute, getOrders);
router.post("/create-payment-intent", protectRoute, createPaymentIntent);

export default router;
