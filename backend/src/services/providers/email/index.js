import { ENV } from '../../../config/env.js';
import { MailpitEmailProvider } from './mailpitEmailProvider.js';

// Factory: pick the email provider based on EMAIL_PROVIDER env var.
// Today we only ship a Mailpit-compatible plain-SMTP provider, which works
// against any unauthenticated localhost SMTP (Mailpit, MailHog, etc.).
// Add new providers here (e.g. nodemailer-backed for real prod email).
export function getEmailProvider() {
    const choice = (ENV.EMAIL_PROVIDER || 'mailpit').toLowerCase();
    switch (choice) {
        case 'mailpit':
            return MailpitEmailProvider;
        default:
            console.warn(
                `[email] Unknown EMAIL_PROVIDER="${choice}", falling back to mailpit.`
            );
            return MailpitEmailProvider;
    }
}
