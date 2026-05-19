import { z } from 'zod';
import { objectIdString } from './common.schema.js';

export const addToCartSchema = z.object({
    body: z.object({
        productId: objectIdString,
        quantity: z.coerce.number().int().positive().max(100).optional(),
    }),
});

export const updateCartItemSchema = z.object({
    params: z.object({
        productId: objectIdString,
    }),
    body: z.object({
        quantity: z.coerce.number().int().positive().max(100),
    }),
});

export const productIdParamSchema = z.object({
    params: z.object({
        productId: objectIdString,
    }),
});
