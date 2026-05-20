import mongoose from 'mongoose';

// One row per OTP issued. We never store the raw OTP — only a SHA-256 hash
// (see services/otp.service.js). On verify we hash the user-supplied code
// and compare. `consumedAt` is set once verification succeeds so the same
// OTP can't be replayed; `attempts` bounds brute-force.
//
// `expiresAt` is also used by a TTL index so MongoDB auto-cleans expired
// records — handy because nothing else prunes this collection.
const otpVerificationSchema = new mongoose.Schema(
    {
        // Optional: filled once we've created a User row. For registration we
        // create the (unverified) User up-front, so this is always set.
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        // Optional: email-only signups have no phone. Kept for the SMS path.
        phoneNumber: {
            type: String,
            index: true,
        },
        otpHash: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ['register', 'login'],
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        consumedAt: {
            type: Date,
            default: null,
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// TTL index: documents auto-delete once `expiresAt` is in the past.
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpVerification = mongoose.model(
    'OtpVerification',
    otpVerificationSchema
);
