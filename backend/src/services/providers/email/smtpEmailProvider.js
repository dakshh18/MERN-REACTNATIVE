import nodemailer from 'nodemailer';
import { ENV } from '../../../config/env.js';

// Real SMTP email provider (works with Gmail, AWS SES, Postmark, Resend SMTP,
// any plain old SMTP relay). Designed for production where MailpitEmailProvider
// can't reach localhost:1025.
//
// Gmail App-Password setup (≈5 min, free):
//   1. Enable 2-Step Verification on the Google account.
//   2. https://myaccount.google.com/apppasswords → create one for "Mail".
//   3. Set on the EC2 backend/.env:
//        EMAIL_PROVIDER=smtp
//        SMTP_HOST=smtp.gmail.com
//        SMTP_PORT=587
//        SMTP_SECURE=false        ← STARTTLS on 587
//        SMTP_USER=<your-gmail>
//        SMTP_PASS=<16-char app password, no spaces>
//        EMAIL_FROM="Mern Shop <your-gmail@gmail.com>"
//
// We create a single reusable transporter, not one per send — nodemailer pools
// connections and Gmail will rate-limit you hard if you open a fresh socket
// for every message.

let cachedTransporter = null;

function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    const host = ENV.SMTP_HOST;
    const port = Number(ENV.SMTP_PORT || 587);
    const user = ENV.SMTP_USER;
    const pass = ENV.SMTP_PASS;
    // SMTP_SECURE=true means TLS on connect (usually port 465). false means
    // upgrade-via-STARTTLS (usually port 587). Coerce the string carefully.
    const secure = String(ENV.SMTP_SECURE || 'false').toLowerCase() === 'true';

    if (!host) {
        throw new Error(
            'SMTP_HOST is required when EMAIL_PROVIDER=smtp. See backend/.env.example.'
        );
    }

    cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user || pass ? { user, pass } : undefined,
        // Pool a few connections — Gmail allows ~100 messages/day for app
        // passwords, far more than we'll send during normal use.
        pool: true,
        maxConnections: 3,
    });

    return cachedTransporter;
}

export const SmtpEmailProvider = {
    name: 'smtp',
    async sendOtpEmail(toEmail, otp) {
        const from = ENV.EMAIL_FROM || 'no-reply@example.com';
        const subject = 'Your verification code';
        const expiryMinutes = ENV.AUTH_OTP_EXPIRY_MINUTES || 5;

        const text =
            `Your one-time verification code is: ${otp}\n\n` +
            `This code expires in ${expiryMinutes} minutes.\n` +
            `If you did not request this, you can safely ignore this email.`;
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:480px; margin:0 auto; padding:24px;">
              <h2 style="margin:0 0 12px;">Your verification code</h2>
              <p style="margin:0 0 20px; color:#444;">
                Enter the code below to finish signing in.
              </p>
              <div style="font-size:32px; letter-spacing:12px; font-weight:700; background:#f4f4f5; padding:16px; border-radius:12px; text-align:center; color:#111;">
                ${otp}
              </div>
              <p style="margin:20px 0 0; color:#777; font-size:13px;">
                This code expires in ${expiryMinutes} minutes. If you didn't request it, you can ignore this email.
              </p>
            </div>
        `;

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail({
                from,
                to: toEmail,
                subject,
                text,
                html,
            });
            console.log(`[email:smtp] sent to ${toEmail} (id=${info.messageId})`);
        } catch (err) {
            // Bubble nothing — controller still returns 200 so SMS OTP can land.
            // But log loudly so pm2 logs surface it.
            console.error(`[email:smtp] send failed for ${toEmail}: ${err.message}`);
        }
    },
};
