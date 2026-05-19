import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DB_URL: process.env.DB_URL,
    CLERK_PUBLISHABLE_KEY : process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY : process.env.CLERK_SECRET_KEY,
    INNGEST_SIGNING_KEY : process.env.INNGEST_SIGNING_KEY,
    CLOUDINARY_API_KEY : process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET : process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME : process.env.CLOUDINARY_CLOUD_NAME,
    ADMIN_EMAIL : process.env.ADMIN_EMAIL,
    CLIENT_URL : process.env.CLIENT_URL,
    STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY,

    // ── Local email/password+OTP auth ────────────────────────────────────────
    // HS256 secret used to sign our own JWTs (separate from Clerk's sessions).
    // Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
    JWT_SECRET: process.env.JWT_SECRET,

    AUTH_OTP_EXPIRY_MINUTES: process.env.AUTH_OTP_EXPIRY_MINUTES,
    AUTH_OTP_RESEND_COOLDOWN_SECONDS: process.env.AUTH_OTP_RESEND_COOLDOWN_SECONDS,
    AUTH_OTP_MAX_ATTEMPTS: process.env.AUTH_OTP_MAX_ATTEMPTS,

    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,

    SMS_PROVIDER: process.env.SMS_PROVIDER,
    SMS_GATEWAY_BASE_URL: process.env.SMS_GATEWAY_BASE_URL,
    SMS_GATEWAY_API_KEY: process.env.SMS_GATEWAY_API_KEY,
}
