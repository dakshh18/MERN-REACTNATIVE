import { describe, it, beforeAll, afterAll, beforeEach, vi, expect } from 'vitest';
import request from 'supertest';

vi.mock('../src/middlewares/auth.middleware.js', () => ({
    protectRoute: async (req, _res, next) => {
        const { User } = await import('../src/models/user.model.js');
        let user = await User.findOne({ clerkId: 'test-user' });
        if (!user) {
            user = await User.create({
                clerkId: 'test-user',
                email: 'test@example.com',
                name: 'Test User',
            });
        }
        req.user = user;
        next();
    },
    adminOnly: (_req, _res, next) => next(),
}));

vi.mock('@clerk/express', () => ({
    clerkMiddleware: () => (_req, _res, next) => next(),
    requireAuth: () => (_req, _res, next) => next(),
}));

// Stripe is external; we don't want tests hitting the real API.
vi.mock('../src/config/stripe.js', () => ({
    stripe: {
        paymentIntents: {
            retrieve: vi.fn(),
            create: vi.fn(),
        },
    },
}));

import { app } from '../src/server.js';
import { Product } from '../src/models/product.model.js';
import { Order } from '../src/models/order.model.js';
import { Cart } from '../src/models/cart.model.js';
import { User } from '../src/models/user.model.js';
import { stripe } from '../src/config/stripe.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './helpers.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(async () => {
    await clearTestDB();
    vi.clearAllMocks();
});

async function seedProductInCart({ stock = 10, price = 50, quantity = 1 } = {}) {
    const product = await Product.create({
        name: 'Test Product',
        description: 'desc',
        price,
        stock,
        category: 'Electronics',
        images: ['https://example.com/img.jpg'],
    });
    // Trigger user creation + add to cart via the public API.
    await request(app)
        .post('/api/cart')
        .send({ productId: product._id.toString(), quantity });
    return product;
}

const validShippingAddress = {
    fullName: 'Test User',
    streetAddress: '123 Test St',
    city: 'Mumbai',
    state: 'MH',
    zipCode: '400001',
    phoneNumber: '9876543210',
};

describe('POST /api/orders — happy path (transactional)', () => {
    it('creates an order, decrements stock, and clears the cart in one transaction', async () => {
        const product = await seedProductInCart({ stock: 5, price: 100, quantity: 2 });
        const user = await User.findOne({ clerkId: 'test-user' });

        // Stripe says payment succeeded for the exact expected amount (200 + 5 shipping = 205 USD = 20500 cents).
        stripe.paymentIntents.retrieve.mockResolvedValue({
            id: 'pi_test_happy',
            status: 'succeeded',
            amount: 20500,
            metadata: { userId: user._id.toString() },
        });

        const res = await request(app)
            .post('/api/orders')
            .send({
                shippingAddress: validShippingAddress,
                paymentIntentId: 'pi_test_happy',
            });

        expect(res.status).toBe(201);
        expect(res.body.order.totalPrice).toBe(205);
        expect(res.body.order.paymentResult.status).toBe('paid');

        // Verify side effects in the DB.
        const orders = await Order.find();
        expect(orders).toHaveLength(1);

        const refreshedProduct = await Product.findById(product._id);
        expect(refreshedProduct.stock).toBe(3); // 5 - 2

        const cart = await Cart.findOne({ user: user._id });
        expect(cart.items).toEqual([]);
    });
});

describe('POST /api/orders — atomic stock guard', () => {
    it('aborts the transaction (409) when the compare-and-swap loses to a concurrent buyer', async () => {
        // Setup: cart wants 3 of a product with stock=10. The outer buildOrderFromCart
        // pre-check sees stock=10 and lets us in — no early 400. Then, simulating a
        // concurrent buyer who grabbed the units between our cart-read and our atomic
        // decrement, we stub Product.findOneAndUpdate to return null on its first call
        // (the conditional { stock: { $gte: 3 } } "lost the race"). The inner 409 guard
        // must fire and the transaction must roll back cleanly.
        const product = await seedProductInCart({ stock: 10, price: 100, quantity: 3 });
        const user = await User.findOne({ clerkId: 'test-user' });
        const spy = vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/orders')
            .send({ shippingAddress: validShippingAddress }); // cod, no paymentIntentId

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/insufficient stock/i);

        // Verify rollback: no order, real stock untouched, cart still intact.
        expect(await Order.countDocuments()).toBe(0);
        const refreshedProduct = await Product.findById(product._id);
        expect(refreshedProduct.stock).toBe(10);
        const cart = await Cart.findOne({ user: user._id });
        expect(cart.items).toHaveLength(1);

        spy.mockRestore();
    });
});

describe('PATCH /api/admin/orders/:orderId/status — Zod enum validation', () => {
    it('returns 400 when status is not one of pending|shipped|delivered', async () => {
        // Seed an order directly so we have an :orderId to target.
        const product = await Product.create({
            name: 'P',
            description: 'd',
            price: 10,
            stock: 10,
            category: 'Electronics',
            images: ['x'],
        });
        const order = await Order.create({
            user: '507f1f77bcf86cd799439011',
            orderItems: [{
                product: product._id,
                name: 'P',
                price: 10,
                quantity: 1,
                image: 'x',
            }],
            shippingAddress: validShippingAddress,
            paymentResult: { id: 'cod', status: 'pending' },
            totalPrice: 15,
        });

        const res = await request(app)
            .patch(`/api/admin/orders/${order._id}/status`)
            .send({ status: 'YOLO' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.some((e) => e.path === 'body.status')).toBe(true);
    });
});
