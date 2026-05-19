import { User } from '../models/user.model.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signLocalJwt } from '../utils/jwt.js';
import {
    createOtpRecord,
    verifyOtpRecord,
    isWithinResendCooldown,
} from '../services/otp.service.js';
import { getEmailProvider } from '../services/providers/email/index.js';
import { getSmsProvider } from '../services/providers/sms/index.js';
import { normalizeIndianPhone } from '../utils/phone.js';

// Defensive normalization. The zod schema already transforms phone numbers
// to E.164, but the project's validate middleware doesn't write the parsed
// body back to req.body — so we re-normalize here to be safe.
function normalizePhoneInput(v) {
    if (!v) return undefined;
    const n = normalizeIndianPhone(v);
    return n || undefined;
}

// Public-safe shape returned to the client. NEVER include passwordHash / OTP.
function publicUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        isOtpVerified: user.isOtpVerified,
        authProvider: user.authProvider,
        imageUrl: user.imageUrl || '',
    };
}

// Look up a user by either email or phone — both fields are unique. Used by
// /login/start, /*/verify, and /otp/resend.
async function findByEmailOrPhone({ email, phoneNumber }, { withPassword = false } = {}) {
    const normalizedEmail = email ? String(email).toLowerCase().trim() : null;
    const normalizedPhone = phoneNumber ? normalizePhoneInput(phoneNumber) : null;
    if (!normalizedEmail && !normalizedPhone) return null;
    const query = normalizedEmail ? { email: normalizedEmail } : { phoneNumber: normalizedPhone };
    let q = User.findOne(query);
    if (withPassword) q = q.select('+passwordHash');
    return q.exec();
}

// Generic message used wherever we want to avoid leaking which identifier
// belongs to a real account.
const GENERIC_OK = 'If the details are valid, an OTP has been sent to the registered email and phone.';

// Best-effort fan-out: send OTP via email + SMS in parallel. We don't fail the
// HTTP request if one of them is down (e.g. Mailpit not running locally) —
// providers log loudly to stderr instead.
async function dispatchOtp({ email, phoneNumber, otp }) {
    const emailProvider = getEmailProvider();
    const smsProvider = getSmsProvider();
    await Promise.allSettled([
        emailProvider.sendOtpEmail(email, otp),
        smsProvider.sendOtpSms(phoneNumber, otp),
    ]);
}

// ───────────────────────────────────────────────────────────────────────────
// POST /api/auth/register/start
// ───────────────────────────────────────────────────────────────────────────
export const registerStart = async (req, res) => {
    try {
        const { name, password } = req.body;
        const email = String(req.body.email || '').toLowerCase().trim();
        const phoneNumber = normalizePhoneInput(req.body.phoneNumber);
        if (!phoneNumber) {
            return res.status(400).json({
                message: 'Enter a valid Indian mobile number (10 digits, starting with 6/7/8/9).',
            });
        }

        // Duplicate-check both identifiers up-front so we don't half-create a row.
        const existingEmail = await User.findOne({ email });
        if (existingEmail && existingEmail.isOtpVerified) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        const existingPhone = await User.findOne({ phoneNumber });
        if (existingPhone && existingPhone.isOtpVerified && (!existingEmail || !existingEmail._id.equals(existingPhone._id))) {
            return res.status(409).json({ message: 'An account with this phone number already exists.' });
        }

        const passwordHash = await hashPassword(password);

        // If an unverified user already exists for this email (abandoned signup),
        // overwrite their details and re-issue an OTP rather than refusing — UX
        // win + avoids orphaned rows pinning the unique email index.
        let user;
        if (existingEmail && !existingEmail.isOtpVerified) {
            existingEmail.name = name;
            existingEmail.phoneNumber = phoneNumber;
            existingEmail.passwordHash = passwordHash;
            existingEmail.authProvider = 'local';
            user = await existingEmail.save();
        } else {
            user = await User.create({
                name,
                email,
                phoneNumber,
                phoneCountryCode: '+91',
                passwordHash,
                authProvider: 'local',
                isOtpVerified: false,
            });
        }

        const { plainOtp } = await createOtpRecord({
            userId: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            purpose: 'register',
        });

        await dispatchOtp({ email: user.email, phoneNumber: user.phoneNumber, otp: plainOtp });

        return res.status(200).json({
            message: 'OTP sent to your email and phone. Enter it to finish creating your account.',
            // Identifier the client should echo back on /verify.
            email: user.email,
        });
    } catch (err) {
        console.error('Error in registerStart:', err);
        // Mongo duplicate-key — race with another signup.
        if (err && err.code === 11000) {
            return res.status(409).json({ message: 'Email or phone number is already registered.' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ───────────────────────────────────────────────────────────────────────────
// POST /api/auth/register/verify
// ───────────────────────────────────────────────────────────────────────────
export const registerVerify = async (req, res) => {
    try {
        const { email, phoneNumber, otp } = req.body;
        const user = await findByEmailOrPhone({ email, phoneNumber });
        if (!user) {
            // Generic message — don't tell the client whether the identifier exists.
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        const result = await verifyOtpRecord({
            userId: user._id,
            purpose: 'register',
            otp,
        });

        if (!result.ok) {
            if (result.reason === 'expired') {
                return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
            }
            if (result.reason === 'too_many_attempts') {
                return res
                    .status(429)
                    .json({ message: 'Too many incorrect attempts. Request a new OTP.' });
            }
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        user.isOtpVerified = true;
        await user.save();

        const token = signLocalJwt(user._id);
        return res.status(200).json({
            message: 'Account verified. You are now signed in.',
            token,
            user: publicUser(user),
        });
    } catch (err) {
        console.error('Error in registerVerify:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ───────────────────────────────────────────────────────────────────────────
// POST /api/auth/login/start
// ───────────────────────────────────────────────────────────────────────────
export const loginStart = async (req, res) => {
    try {
        const { email, phoneNumber, password } = req.body;
        const user = await findByEmailOrPhone({ email, phoneNumber }, { withPassword: true });

        // Generic response shape on failure to avoid user enumeration.
        if (!user || !user.passwordHash || user.authProvider !== 'local') {
            return res.status(200).json({ message: GENERIC_OK });
        }
        if (!user.isOtpVerified) {
            return res.status(403).json({
                message:
                    'Your account exists but is not verified yet. Finish registration with the OTP we sent earlier or request a new one.',
            });
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
            return res.status(200).json({ message: GENERIC_OK });
        }

        const { plainOtp } = await createOtpRecord({
            userId: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            purpose: 'login',
        });
        await dispatchOtp({ email: user.email, phoneNumber: user.phoneNumber, otp: plainOtp });

        return res.status(200).json({
            message: 'OTP sent to your email and phone. Enter it to finish signing in.',
            email: user.email,
        });
    } catch (err) {
        console.error('Error in loginStart:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ───────────────────────────────────────────────────────────────────────────
// POST /api/auth/login/verify
// ───────────────────────────────────────────────────────────────────────────
export const loginVerify = async (req, res) => {
    try {
        const { email, phoneNumber, otp } = req.body;
        const user = await findByEmailOrPhone({ email, phoneNumber });
        if (!user) return res.status(400).json({ message: 'Invalid or expired OTP.' });

        const result = await verifyOtpRecord({
            userId: user._id,
            purpose: 'login',
            otp,
        });
        if (!result.ok) {
            if (result.reason === 'expired') {
                return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
            }
            if (result.reason === 'too_many_attempts') {
                return res
                    .status(429)
                    .json({ message: 'Too many incorrect attempts. Request a new OTP.' });
            }
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        const token = signLocalJwt(user._id);
        return res.status(200).json({
            message: 'Signed in.',
            token,
            user: publicUser(user),
        });
    } catch (err) {
        console.error('Error in loginVerify:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ───────────────────────────────────────────────────────────────────────────
// POST /api/auth/otp/resend
// ───────────────────────────────────────────────────────────────────────────
export const resendOtp = async (req, res) => {
    try {
        const { email, phoneNumber, purpose } = req.body;
        const user = await findByEmailOrPhone({ email, phoneNumber });
        // Always return generic OK to avoid telling clients which identifier exists.
        if (!user) return res.status(200).json({ message: GENERIC_OK });

        const cooldown = await isWithinResendCooldown({ userId: user._id, purpose });
        if (cooldown.cooldown) {
            return res.status(429).json({
                message: `Please wait ${cooldown.secondsLeft}s before requesting another OTP.`,
                secondsLeft: cooldown.secondsLeft,
            });
        }

        const { plainOtp } = await createOtpRecord({
            userId: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            purpose,
        });
        await dispatchOtp({ email: user.email, phoneNumber: user.phoneNumber, otp: plainOtp });

        return res.status(200).json({ message: GENERIC_OK });
    } catch (err) {
        console.error('Error in resendOtp:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ───────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  — returns the currently authed local user (any provider).
// ───────────────────────────────────────────────────────────────────────────
export const me = async (req, res) => {
    return res.status(200).json({ user: publicUser(req.user) });
};
