import { z } from 'zod';
import { objectIdString } from './common.schema.js';

export const updateOrderStatusSchema = z.object({
    params: z.object({
        orderId: objectIdString,
    }),
    body: z.object({
        status: z.enum(['pending', 'shipped', 'delivered']),
    }),
});
