import { describe, it, beforeAll, afterAll, beforeEach, vi, expect } from 'vitest';
import request from 'supertest';

// Mocks must be declared before importing app (vitest hoists vi.mock calls).
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

import { app } from '../src/server.js';
import { Product } from '../src/models/product.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './helpers.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

async function seedProduct({ stock = 10, price = 50 } = {}) {
    return Product.create({
        name: 'Test Product',
        description: 'A product used in tests',
        price,
        stock,
        category: 'Electronics',
        images: ['https://example.com/img.jpg'],
    });
}

describe('GET /api/cart', () => {
    it('returns an empty cart for a new user', async () => {
        const res = await request(app).get('/api/cart');

        expect(res.status).toBe(200);
        expect(res.body.cart).toBeDefined();
        expect(res.body.cart.items).toEqual([]);
    });
});

describe('POST /api/cart', () => {
    it('adds a product to the cart with valid productId', async () => {
        const product = await seedProduct();

        const res = await request(app)
            .post('/api/cart')
            .send({ productId: product._id.toString(), quantity: 2 });

        expect(res.status).toBe(200);
        expect(res.body.cart.items).toHaveLength(1);
        expect(res.body.cart.items[0].product.toString()).toBe(product._id.toString());
        expect(res.body.cart.items[0].quantity).toBe(2);
    });

    it('returns 400 with a Zod error when productId is not a valid ObjectId', async () => {
        const res = await request(app)
            .post('/api/cart')
            .send({ productId: 'not-an-objectid', quantity: 1 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.some((e) => e.path === 'body.productId')).toBe(true);
    });

    it('returns 400 when product stock is insufficient', async () => {
        const product = await seedProduct({ stock: 1 });

        const res = await request(app)
            .post('/api/cart')
            .send({ productId: product._id.toString(), quantity: 5 });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/insufficient stock/i);
    });
});
