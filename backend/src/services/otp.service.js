import crypto from 'crypto';
import { OtpVerification } from '../models/otp.model.js';
import { ENV } from '../config/env.js';

// OTP service: generate / hash / compare / persist 6-digit codes.
//
// Hashing strategy: SHA-256 with a server-side pepper (JWT_SECRET reused so we
// don't add another required env var — the OTP table is short-lived and codes
// are 6 digits, so this is sufficient when combined with attempt limits and
// the 5-minute expiry. We never store the raw OTP.

function pepper() {
    return ENV.JWT_SECRET || '';
}

export function generateOtp() {
    // 6-digit numeric, zero-padded. randomInt avoids modulo bias.
    const n = crypto.randomInt(0, 1_000_000);
    return String(n).padStart(6, '0');
}

export function hashOtp(otp) {
    return crypto
        .createHash('sha256')
        .update(`${pepper()}|${String(otp)}`)
        .digest('hex');
}

export function compareOtp(plainOtp, otpHash) {
    if (typeof plainOtp !== 'string' || typeof otpHash !== 'string') return false;
    const a = Buffer.from(hashOtp(plainOtp), 'hex');
    const b = Buffer.from(otpHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

// Create a new OTP row, invalidating any prior unconsumed OTPs for the same
// (userId, purpose). Returns { record, plainOtp } — caller is responsible for
// sending the plain OTP to email + SMS and then discarding it.
export async function createOtpRecord({ userId, email, phoneNumber, purpose }) {
    const expiryMinutes = Number(ENV.AUTH_OTP_EXPIRY_MINUTES || 5);
    const plainOtp = generateOtp();
    const otpHash = hashOtp(plainOtp);

    // Invalidate older outstanding OTPs for this user+purpose so a stale
    // OTP can't be used after a resend.
    await OtpVerification.updateMany(
        { userId, purpose, consumedAt: null },
        { $set: { consumedAt: new Date() } }
    );

    const record = await OtpVerification.create({
        userId,
        email,
        phoneNumber,
        otpHash,
        purpose,
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });

    return { record, plainOtp };
}

// Verify a user-supplied OTP for a (userId, purpose). Returns:
//   { ok: true, record } on success (record is marked consumed)
//   { ok: false, reason: 'no_otp' | 'expired' | 'too_many_attempts' | 'mismatch' }
export async function verifyOtpRecord({ userId, purpose, otp }) {
    const maxAttempts = Number(ENV.AUTH_OTP_MAX_ATTEMPTS || 5);
    const record = await OtpVerification.findOne({
        userId,
        purpose,
        consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!record) return { ok: false, reason: 'no_otp' };

    if (record.expiresAt.getTime() < Date.now()) {
        return { ok: false, reason: 'expired' };
    }

    if (record.attempts >= maxAttempts) {
        return { ok: false, reason: 'too_many_attempts' };
    }

    if (!compareOtp(otp, record.otpHash)) {
        record.attempts += 1;
        await record.save();
        return { ok: false, reason: 'mismatch', attemptsLeft: maxAttempts - record.attempts };
    }

    record.consumedAt = new Date();
    await record.save();
    return { ok: true, record };
}

// True if the most recent OTP for (userId, purpose) is younger than the
// configured resend cooldown. Used to throttle /auth/otp/resend.
export async function isWithinResendCooldown({ userId, purpose }) {
    const cooldownSec = Number(ENV.AUTH_OTP_RESEND_COOLDOWN_SECONDS || 60);
    const latest = await OtpVerification.findOne({ userId, purpose }).sort({
        createdAt: -1,
    });
    if (!latest) return { cooldown: false, secondsLeft: 0 };
    const ageSec = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (ageSec >= cooldownSec) return { cooldown: false, secondsLeft: 0 };
    return { cooldown: true, secondsLeft: Math.ceil(cooldownSec - ageSec) };
}
