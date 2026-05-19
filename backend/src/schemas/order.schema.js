import { z } from 'zod';

const shippingAddressSchema = z.object({
    fullName: z.string().trim().min(1).max(120),
    streetAddress: z.string().trim().max(200).optional(),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80),
    zipCode: z.coerce.string().regex(/^\d{6}$/, '6-digit zipCode required'),
    phoneNumber: z.coerce.string().regex(/^\d{10}$/, '10-digit phone number required'),
});

export const createOrderSchema = z.object({
    body: z.object({
        shippingAddress: shippingAddressSchema,
        paymentIntentId: z.string().min(1).optional(),
    }),
});
