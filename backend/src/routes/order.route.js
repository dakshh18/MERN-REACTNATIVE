import { Router } from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createOrder, createPaymentIntent, getOrders } from '../controllers/order.controller.js';
import { createOrderSchema } from '../schemas/order.schema.js';

const router = Router();

router.post("/", protectRoute, validate(createOrderSchema), createOrder);
router.get("/", protectRoute, getOrders);
router.post("/create-payment-intent", protectRoute, createPaymentIntent);

export default router;
