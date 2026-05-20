import { describe, it, beforeAll, afterAll, beforeEach, vi, expect } from 'vitest';
import request from 'supertest';

// Email + SMS providers are mocked to in-memory spies so tests are fast and
// don't depend on Mailpit being up. The factories are what controllers call.
const emailCalls = [];
const smsCalls = [];

vi.mock('../src/services/providers/email/index.js', () => ({
    getEmailProvider: () => ({
        name: 'test-email',
        async sendOtpEmail(to, otp) {
            emailCalls.push({ to, otp });
        },
    }),
}));

vi.mock('../src/services/providers/sms/index.js', () => ({
    getSmsProvider: () => ({
        name: 'test-sms',
        async sendOtpSms(to, otp) {
            smsCalls.push({ to, otp });
        },
    }),
}));

// JWT_SECRET must exist before any module imports env.js. dotenv.config()
// doesn't overwrite already-set process.env vars, so this sticks.
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.AUTH_OTP_RESEND_COOLDOWN_SECONDS = '60';
process.env.AUTH_OTP_EXPIRY_MINUTES = '5';
process.env.AUTH_OTP_MAX_ATTEMPTS = '5';

// We don't need Clerk in these tests — the new /api/auth/* endpoints don't
// touch it — but server.js still mounts clerkMiddleware. Stub it to a no-op.
vi.mock('@clerk/express', () => ({
    clerkMiddleware: () => (_req, _res, next) => next(),
    requireAuth: () => (_req, _res, next) => next(),
    clerkClient: { users: { getUser: vi.fn() } },
}));

import { app } from '../src/server.js';
import { User } from '../src/models/user.model.js';
import { OtpVerification } from '../src/models/otp.model.js';
import { normalizeIndianPhone, isValidIndianPhone } from '../src/utils/phone.js';
import {
    generateOtp,
    hashOtp,
    compareOtp,
} from '../src/services/otp.service.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './helpers.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(async () => {
    await clearTestDB();
    emailCalls.length = 0;
    smsCalls.length = 0;
});

// Capture the OTP delivered to the mocked email provider in the most recent
// fan-out. Email and SMS get the same OTP, so either is fine.
function lastSentOtp() {
    const last = emailCalls[emailCalls.length - 1];
    return last?.otp;
}

describe('utils/phone — Indian phone normalization', () => {
    it('normalizes plain 10-digit numbers', () => {
        expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
    });
    it('normalizes +91 prefixed numbers', () => {
        expect(normalizeIndianPhone('+919876543210')).toBe('+919876543210');
    });
    it('normalizes 91-prefixed (no plus) numbers', () => {
        expect(normalizeIndianPhone('919876543210')).toBe('+919876543210');
    });
    it('strips spaces and dashes', () => {
        expect(normalizeIndianPhone('98765 43210')).toBe('+919876543210');
        expect(normalizeIndianPhone('+91-98765-43210')).toBe('+919876543210');
    });
    it('rejects numbers that do not start with 6/7/8/9', () => {
        expect(normalizeIndianPhone('5876543210')).toBeNull();
        expect(isValidIndianPhone('1234567890')).toBe(false);
    });
    it('rejects wrong-length numbers', () => {
        expect(normalizeIndianPhone('98765')).toBeNull();
        expect(normalizeIndianPhone('98765432100')).toBeNull();
    });
});

describe('otp.service — generate / hash / compare', () => {
    it('generates 6-digit numeric OTPs', () => {
        for (let i = 0; i < 50; i++) {
            const otp = generateOtp();
            expect(otp).toMatch(/^\d{6}$/);
        }
    });
    it('hashOtp is deterministic for the same input', () => {
        expect(hashOtp('123456')).toBe(hashOtp('123456'));
    });
    it('compareOtp returns true for matching OTP+hash', () => {
        const h = hashOtp('424242');
        expect(compareOtp('424242', h)).toBe(true);
        expect(compareOtp('424243', h)).toBe(false);
    });
});

describe('POST /api/auth/register/start — validation', () => {
    it('rejects missing fields with 400', async () => {
        const res = await request(app).post('/api/auth/register/start').send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Validation failed');
    });

    it('rejects short passwords', async () => {
        const res = await request(app)
            .post('/api/auth/register/start')
            .send({
                name: 'Daksh',
                email: 'a@b.com',
                password: 'short',
                phoneNumber: '9876543210',
            });
        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.path === 'body.password')).toBe(true);
    });

    it('rejects non-Indian phone numbers', async () => {
        const res = await request(app)
            .post('/api/auth/register/start')
            .send({
                name: 'Daksh',
                email: 'a@b.com',
                password: 'longenoughpw',
                phoneNumber: '1234567890',
            });
        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.path === 'body.phoneNumber')).toBe(true);
    });
});

describe('Register → verify happy path', () => {
    const baseInput = {
        name: 'Daksh',
        email: 'daksh@example.com',
        password: 'correct-horse-battery-staple',
        phoneNumber: '9876543210',
    };

    it('creates an unverified user, sends OTP to email + SMS, then verifies', async () => {
        const startRes = await request(app)
            .post('/api/auth/register/start')
            .send(baseInput);
        expect(startRes.status).toBe(200);
        expect(startRes.body.email).toBe('daksh@example.com');
        // Never leak the OTP in the response.
        expect(JSON.stringify(startRes.body)).not.toMatch(/\d{6}/);

        // Both providers must have been called with the same OTP.
        expect(emailCalls).toHaveLength(1);
        expect(smsCalls).toHaveLength(1);
        expect(emailCalls[0].otp).toBe(smsCalls[0].otp);
        expect(emailCalls[0].to).toBe('daksh@example.com');
        expect(smsCalls[0].to).toBe('+919876543210');

        const user = await User.findOne({ email: 'daksh@example.com' });
        expect(user.isOtpVerified).toBe(false);
        expect(user.phoneNumber).toBe('+919876543210');

        const verifyRes = await request(app)
            .post('/api/auth/register/verify')
            .send({ email: 'daksh@example.com', otp: lastSentOtp() });
        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.token).toBeDefined();
        expect(verifyRes.body.user.isOtpVerified).toBe(true);

        const updated = await User.findById(user._id);
        expect(updated.isOtpVerified).toBe(true);
    });

    it('registers with email only (no phone) and sends OTP via email alone', async () => {
        const startRes = await request(app)
            .post('/api/auth/register/start')
            .send({
                name: 'Phoneless',
                email: 'nophone@example.com',
                password: 'correct-horse-battery-staple',
            });
        expect(startRes.status).toBe(200);

        // Email OTP sent; SMS skipped entirely (no phone on file).
        expect(emailCalls).toHaveLength(1);
        expect(smsCalls).toHaveLength(0);

        const user = await User.findOne({ email: 'nophone@example.com' });
        expect(user).toBeTruthy();
        expect(user.phoneNumber).toBeUndefined();

        const verifyRes = await request(app)
            .post('/api/auth/register/verify')
            .send({ email: 'nophone@example.com', otp: lastSentOtp() });
        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.token).toBeDefined();
    });

    it('rejects an incorrect OTP and tracks attempts', async () => {
        await request(app).post('/api/auth/register/start').send(baseInput);

        const res = await request(app)
            .post('/api/auth/register/verify')
            .send({ email: baseInput.email, otp: '000000' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid/i);

        // OTP row should now have attempts >= 1.
        const user = await User.findOne({ email: baseInput.email });
        const otpRow = await OtpVerification.findOne({ userId: user._id }).sort({ createdAt: -1 });
        expect(otpRow.attempts).toBeGreaterThanOrEqual(1);
    });

    it('locks out after AUTH_OTP_MAX_ATTEMPTS bad attempts', async () => {
        await request(app).post('/api/auth/register/start').send(baseInput);

        for (let i = 0; i < 5; i++) {
            await request(app)
                .post('/api/auth/register/verify')
                .send({ email: baseInput.email, otp: '000000' });
        }
        const res = await request(app)
            .post('/api/auth/register/verify')
            .send({ email: baseInput.email, otp: '000000' });
        expect(res.status).toBe(429);
        expect(res.body.message).toMatch(/too many/i);
    });

    it('reclaims an abandoned (unverified) row that collides on phone but not email', async () => {
        // First signup: leaves an unverified row with phone +91-9876543210.
        await request(app).post('/api/auth/register/start').send({
            name: 'Abandoner',
            email: 'first@example.com',
            password: 'longenoughpw',
            phoneNumber: '9876543210',
        });

        // Second signup: different email, SAME phone. Without the reclaim
        // logic this would crash with a Mongo E11000 dup-key on phoneNumber.
        const res = await request(app).post('/api/auth/register/start').send({
            name: 'Newcomer',
            email: 'second@example.com',
            password: 'longenoughpw',
            phoneNumber: '9876543210',
        });
        expect(res.status).toBe(200);

        // Only one user should now hold this phone — the new one.
        const users = await User.find({ phoneNumber: '+919876543210' });
        expect(users).toHaveLength(1);
        expect(users[0].email).toBe('second@example.com');
    });

    it('reclaims an abandoned (unverified) row that collides on email but not phone', async () => {
        await request(app).post('/api/auth/register/start').send({
            name: 'Abandoner',
            email: 'same@example.com',
            password: 'longenoughpw',
            phoneNumber: '9876543210',
        });
        const res = await request(app).post('/api/auth/register/start').send({
            name: 'Newcomer',
            email: 'same@example.com',
            password: 'longenoughpw',
            phoneNumber: '9876543211',
        });
        expect(res.status).toBe(200);

        const users = await User.find({ email: 'same@example.com' });
        expect(users).toHaveLength(1);
        expect(users[0].phoneNumber).toBe('+919876543211');
    });

    it('rejects when a VERIFIED user already owns the phone', async () => {
        // Seed a verified user holding the phone.
        await request(app).post('/api/auth/register/start').send({
            name: 'Owner',
            email: 'owner@example.com',
            password: 'longenoughpw',
            phoneNumber: '9876543210',
        });
        await request(app).post('/api/auth/register/verify').send({
            email: 'owner@example.com',
            otp: lastSentOtp(),
        });

        const res = await request(app).post('/api/auth/register/start').send({
            name: 'Intruder',
            email: 'intruder@example.com',
            password: 'longenoughpw',
            phoneNumber: '9876543210',
        });
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/phone/i);
    });

    it('rejects an expired OTP', async () => {
        await request(app).post('/api/auth/register/start').send(baseInput);
        const user = await User.findOne({ email: baseInput.email });

        // Manually backdate the OTP so it's expired.
        await OtpVerification.updateMany(
            { userId: user._id },
            { $set: { expiresAt: new Date(Date.now() - 1000) } }
        );

        const res = await request(app)
            .post('/api/auth/register/verify')
            .send({ email: baseInput.email, otp: lastSentOtp() });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/expired/i);
    });
});

describe('Login flow', () => {
    async function seedVerifiedUser() {
        await request(app).post('/api/auth/register/start').send({
            name: 'Daksh',
            email: 'daksh@example.com',
            password: 'correct-horse-battery-staple',
            phoneNumber: '9876543210',
        });
        await request(app).post('/api/auth/register/verify').send({
            email: 'daksh@example.com',
            otp: lastSentOtp(),
        });
        // Clear capture so next assertions start fresh.
        emailCalls.length = 0;
        smsCalls.length = 0;
    }

    it('login/start sends an OTP for valid credentials', async () => {
        await seedVerifiedUser();
        const res = await request(app).post('/api/auth/login/start').send({
            email: 'daksh@example.com',
            password: 'correct-horse-battery-staple',
        });
        expect(res.status).toBe(200);
        expect(emailCalls).toHaveLength(1);
        expect(smsCalls).toHaveLength(1);
        expect(emailCalls[0].otp).toBe(smsCalls[0].otp);
    });

    it('login/start returns a generic 200 for bad password (no enumeration)', async () => {
        await seedVerifiedUser();
        const res = await request(app).post('/api/auth/login/start').send({
            email: 'daksh@example.com',
            password: 'WRONG_PW',
        });
        expect(res.status).toBe(200);
        // Importantly: no OTP was sent.
        expect(emailCalls).toHaveLength(0);
        expect(smsCalls).toHaveLength(0);
    });

    it('login/verify issues a JWT and returns the user', async () => {
        await seedVerifiedUser();
        await request(app).post('/api/auth/login/start').send({
            email: 'daksh@example.com',
            password: 'correct-horse-battery-staple',
        });
        const res = await request(app).post('/api/auth/login/verify').send({
            email: 'daksh@example.com',
            otp: lastSentOtp(),
        });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('daksh@example.com');
    });

    it('login by phone also works', async () => {
        await seedVerifiedUser();
        const res = await request(app).post('/api/auth/login/start').send({
            phoneNumber: '9876543210',
            password: 'correct-horse-battery-staple',
        });
        expect(res.status).toBe(200);
        expect(emailCalls).toHaveLength(1);
    });
});

describe('POST /api/auth/otp/resend — cooldown', () => {
    it('returns 429 when a previous OTP is younger than the cooldown', async () => {
        await request(app).post('/api/auth/register/start').send({
            name: 'Daksh',
            email: 'daksh@example.com',
            password: 'correct-horse-battery-staple',
            phoneNumber: '9876543210',
        });

        const res = await request(app).post('/api/auth/otp/resend').send({
            email: 'daksh@example.com',
            purpose: 'register',
        });
        expect(res.status).toBe(429);
        expect(res.body.secondsLeft).toBeGreaterThan(0);
    });

    it('issues a new OTP once the cooldown elapses', async () => {
        await request(app).post('/api/auth/register/start').send({
            name: 'Daksh',
            email: 'daksh@example.com',
            password: 'correct-horse-battery-staple',
            phoneNumber: '9876543210',
        });

        // Backdate the existing OTP record so the cooldown has "passed". We
        // go through the native collection because Mongoose's `timestamps`
        // option strips createdAt from $set on updateMany calls.
        const user = await User.findOne({ email: 'daksh@example.com' });
        await OtpVerification.collection.updateMany(
            { userId: user._id },
            { $set: { createdAt: new Date(Date.now() - 5 * 60 * 1000) } }
        );

        emailCalls.length = 0;
        smsCalls.length = 0;

        const res = await request(app).post('/api/auth/otp/resend').send({
            email: 'daksh@example.com',
            purpose: 'register',
        });
        expect(res.status).toBe(200);
        expect(emailCalls).toHaveLength(1);
        expect(smsCalls).toHaveLength(1);
    });
});
