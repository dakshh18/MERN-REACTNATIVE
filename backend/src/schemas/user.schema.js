import { z } from 'zod';
import { objectIdString } from './common.schema.js';

const addressBody = z.object({
    label: z.string().trim().min(1).max(40),
    fullName: z.string().trim().min(1).max(120),
    streetAddress: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80),
    zipCode: z.coerce.string().regex(/^\d{6}$/, '6-digit zipCode required'),
    phoneNumber: z.coerce.string().regex(/^\d{10}$/, '10-digit phone number required'),
    isDefault: z.boolean().optional(),
});

export const addAddressSchema = z.object({
    body: addressBody,
});

export const updateAddressSchema = z.object({
    params: z.object({
        addressId: objectIdString,
    }),
    // All fields optional on update — caller can patch a subset.
    body: addressBody.partial(),
});

export const addressIdParamSchema = z.object({
    params: z.object({
        addressId: objectIdString,
    }),
});

export const addToWishlistSchema = z.object({
    body: z.object({
        productId: objectIdString,
    }),
});

export const wishlistProductIdParamSchema = z.object({
    params: z.object({
        productId: objectIdString,
    }),
});

export const registerPushTokenSchema = z.object({
    body: z.object({
        pushToken: z.string().min(1).max(500),
    }),
});
