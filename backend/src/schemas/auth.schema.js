import { z } from 'zod';
import { normalizeIndianPhone } from '../utils/phone.js';

// Reusable Indian-phone field: accepts 9876543210 / +919876543210 / 919876543210,
// stores the normalized E.164 form, rejects anything else with a clear message.
const indianPhone = z
    .string()
    .min(10)
    .transform((v) => normalizeIndianPhone(v))
    .refine((v) => v !== null, {
        message:
            'Enter a valid Indian mobile number (10 digits, starting with 6/7/8/9).',
    });

// Either a (normalized) Indian phone OR an email. Used by login/verify/resend
// where the user can supply either identifier.
const emailOrPhone = z
    .object({
        email: z.string().email().toLowerCase().trim().optional(),
        phoneNumber: z
            .string()
            .optional()
            .transform((v) => (v ? normalizeIndianPhone(v) : v)),
    })
    .refine((v) => Boolean(v.email) || Boolean(v.phoneNumber), {
        message: 'Provide either email or phoneNumber.',
    })
    .refine(
        (v) => !v.phoneNumber || v.phoneNumber !== null,
        { message: 'Enter a valid Indian mobile number.', path: ['phoneNumber'] }
    );

export const registerStartSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
        email: z.string().email().toLowerCase().trim(),
        password: z.string().min(8, 'Password must be at least 8 characters').max(128),
        // Phone is optional: OTP delivery is email-only in this build (no free
        // SMS channel). The field + indianPhone validation stay so a future
        // SMS provider can be re-enabled without a schema change.
        phoneNumber: indianPhone.optional(),
    }),
});

export const verifyOtpSchema = z.object({
    body: emailOrPhone.and(
        z.object({
            otp: z
                .string()
                .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
        })
    ),
});

export const loginStartSchema = z.object({
    body: emailOrPhone.and(
        z.object({
            password: z.string().min(1, 'Password is required'),
        })
    ),
});

export const resendOtpSchema = z.object({
    body: emailOrPhone.and(
        z.object({
            purpose: z.enum(['register', 'login']),
        })
    ),
});
