import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    streetAddress: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    zipCode: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
},{
    timestamps: true,
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    name : {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        default: "",
    },
    // Clerk-managed users have a clerkId. Local (email/password+OTP) users
    // don't, so clerkId is now optional. `sparse` lets the unique index ignore
    // documents that omit the field, letting multiple local users coexist.
    clerkId: {
        type: String,
        unique: true,
        sparse: true,
    },
    // Hashed password (scrypt, see utils/password.js). Only set for local users.
    passwordHash: {
        type: String,
        default: null,
        select: false,
    },
    // E.164 phone (e.g. +919876543210). Unique across local users; sparse so
    // older Clerk users that don't have one don't collide on `null`.
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    phoneCountryCode: {
        type: String,
        default: '+91',
    },
    // True once the OTP for registration has been verified.
    isOtpVerified: {
        type: Boolean,
        default: false,
    },
    // 'clerk' = OAuth via Clerk (existing), 'local' = our email/password+OTP.
    authProvider: {
        type: String,
        enum: ['clerk', 'local'],
        default: 'clerk',
    },
    addresses: [addressSchema],
    wishlist: [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Product",
        }
    ],
    pushTokens: [
        {
            type: String,
        }
    ],

},{
    timestamps: true,
});

export const User = mongoose.model('User', userSchema);
