import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    registerStart,
    registerVerify,
    loginStart,
    loginVerify,
    resendOtp,
    me,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    registerStartSchema,
    verifyOtpSchema,
    loginStartSchema,
    resendOtpSchema,
} from '../schemas/auth.schema.js';
import { requireLocalAuth } from '../middlewares/localAuth.middleware.js';

const router = Router();

// Tight per-IP throttle on the OTP-sending endpoints. The global /api limiter
// is also active (see server.js); this is an extra layer specifically to make
// it expensive to spray OTPs at random emails/phones.
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many OTP requests, please try again later.' },
    skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register/start', otpLimiter, validate(registerStartSchema), registerStart);
router.post('/register/verify', validate(verifyOtpSchema), registerVerify);

router.post('/login/start', otpLimiter, validate(loginStartSchema), loginStart);
router.post('/login/verify', validate(verifyOtpSchema), loginVerify);

router.post('/otp/resend', otpLimiter, validate(resendOtpSchema), resendOtp);

// Whoami for the local JWT.
router.get('/me', requireLocalAuth, me);

export default router;
