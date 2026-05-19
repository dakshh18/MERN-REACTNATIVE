import { z } from 'zod';
import { objectIdString } from './common.schema.js';

export const createReviewSchema = z.object({
    body: z.object({
        productId: objectIdString,
        orderId: objectIdString,
        rating: z.coerce.number().int().min(1).max(5),
    }),
});
