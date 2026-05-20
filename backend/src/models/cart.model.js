import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
});

const cartSchema = new mongoose.Schema({
    // The cart is keyed by the Mongo user _id — works for BOTH Clerk-OAuth
    // users and local (email/OTP) users. (It used to be keyed by clerkId,
    // which local users don't have.) Unique → one cart per user.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    items: [cartItemSchema],
}, { timestamps: true });

export const Cart = mongoose.model("Cart", cartSchema);
