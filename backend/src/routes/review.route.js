import { Router } from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createReview, deleteReview } from '../controllers/review.controller.js';
import { createReviewSchema } from '../schemas/review.schema.js';

const router = Router();

router.post("/", protectRoute, validate(createReviewSchema), createReview);
router.delete("/:reviewId", protectRoute, deleteReview);


export default router;