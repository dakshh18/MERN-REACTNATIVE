import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { Review } from '../models/review.model.js';
import { Cart } from '../models/cart.model.js';
import { stripe } from '../config/stripe.js';
import { sendPushNotifications } from '../utils/push.js';

const SHIPPING_FEE = 5;

// Server-side computation of order items + totals from the user's cart.
// Returns { orderItems, subtotal, totalPrice } or throws an Error with a .status.
async function buildOrderFromCart(user) {
    const cart = await Cart.findOne({ clerkId: user.clerkId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
        const err = new Error('Your cart is empty');
        err.status = 400;
        throw err;
    }

    const orderItems = [];
    let subtotal = 0;
    for (const item of cart.items) {
        const product = item.product;
        if (!product) {
            const err = new Error('A product in your cart no longer exists');
            err.status = 404;
            throw err;
        }
        if (product.stock < item.quantity) {
            const err = new Error(`Insufficient stock for ${product.name}`);
            err.status = 400;
            throw err;
        }
        orderItems.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.images?.[0] ?? '',
        });
        subtotal += product.price * item.quantity;
    }

    return {
        cart,
        orderItems,
        subtotal,
        totalPrice: subtotal + SHIPPING_FEE,
    };
}

export async function createPaymentIntent(req, res) {
    try {
        const user = req.user;
        const { totalPrice } = await buildOrderFromCart(user);

        // Stripe wants amount in the smallest currency unit (cents for USD)
        const amount = Math.round(totalPrice * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
                clerkId: user.clerkId,
                userId: user._id.toString(),
            },
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: totalPrice,
        });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        console.error('Error in createPaymentIntent:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

export async function createOrder(req, res) {
    try {
        const user = req.user;
        const { shippingAddress, paymentIntentId } = req.body;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.city) {
            return res.status(400).json({ message: 'Shipping address is required' });
        }

        const { cart, orderItems, totalPrice } = await buildOrderFromCart(user);

        // Stripe verification stays OUTSIDE the transaction: external network calls
        // don't belong inside a Mongo transaction (long-running, retry-unfriendly).
        let paymentResult = { id: 'cod', status: 'pending' };
        if (paymentIntentId) {
            const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (intent.status !== 'succeeded') {
                return res.status(402).json({
                    message: `Payment not completed (status: ${intent.status})`,
                });
            }
            if (intent.metadata?.clerkId !== user.clerkId) {
                return res.status(403).json({ message: 'Payment does not belong to this user' });
            }
            const expected = Math.round(totalPrice * 100);
            if (intent.amount !== expected) {
                return res.status(400).json({
                    message: 'Cart total changed since payment was authorized. Please retry.',
                });
            }
            paymentResult = { id: intent.id, status: 'paid' };
        }

        // All Mongo writes inside ONE transaction. If any step fails, none persist.
        // Requires a replica set (Atlas free tier qualifies).
        const session = await mongoose.startSession();
        let order;
        try {
            await session.withTransaction(async () => {
                // Atomic compare-and-swap on stock: { stock: { $gte: qty } } guards the decrement.
                // If two checkouts race on the last unit, only one update matches and returns the doc;
                // the loser gets null back and we throw to abort the transaction.
                for (const item of orderItems) {
                    const updated = await Product.findOneAndUpdate(
                        { _id: item.product, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } },
                        { session, new: true }
                    );
                    if (!updated) {
                        const err = new Error(`Insufficient stock for ${item.name}`);
                        err.status = 409;
                        throw err;
                    }
                }

                // Order.create's array form is required to pass { session }.
                const [created] = await Order.create([{
                    user: user._id,
                    clerkId: user.clerkId,
                    orderItems,
                    shippingAddress,
                    paymentResult,
                    totalPrice,
                }], { session });
                order = created;

                // Mongoose's default __v optimistic concurrency on cart.save() aborts the
                // transaction if the cart was modified between buildOrderFromCart and now.
                cart.items = [];
                await cart.save({ session });
            });
        } finally {
            await session.endSession();
        }

        // Fire-and-forget order-placed push (outside transaction, doesn't block the response).
        if (user.pushTokens?.length) {
            sendPushNotifications(user.pushTokens, {
                title: 'Order placed!',
                body: `Your order of $${order.totalPrice.toFixed(2)} is confirmed.`,
                data: { orderId: order._id.toString(), type: 'order_placed' },
            }).catch(() => {});
        }

        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        if (error.name === 'VersionError') {
            return res.status(409).json({
                message: 'Your cart changed during checkout. Please retry.',
            });
        }
        console.error('Error in createOrder controller:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

export async function getOrders(req, res) {
    try {
        const orders = await Order.find({ clerkId: req.user.clerkId })
            .populate('orderItems.product')
            .sort({ createdAt: -1 });

        const orderIds = orders.map((order) => order._id);
        const reviews = await Review.find({ orderId: { $in: orderIds } });
        const reviewedOrderIds = new Set(reviews.map((review) => review.orderId.toString()));

        const orderWithReviewStatus = orders.map((order) => ({
            ...order.toObject(),
            hasReviewed: reviewedOrderIds.has(order._id.toString()),
        }));

        res.status(200).json({ message: 'Orders fetched successfully', orders: orderWithReviewStatus });
    } catch (error) {
        console.error('Error in getOrders controller:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
