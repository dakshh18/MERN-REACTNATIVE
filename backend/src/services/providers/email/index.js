import { ENV } from '../../../config/env.js';
import { MailpitEmailProvider } from './mailpitEmailProvider.js';
import { SmtpEmailProvider } from './smtpEmailProvider.js';

// Factory: pick the email provider based on EMAIL_PROVIDER env var.
//
//   mailpit  → plain-SMTP-no-auth client targeting localhost:1025 (local dev)
//   smtp     → nodemailer transport (Gmail / SES / any real SMTP, see provider)
//
// Add new providers here as needed.
export function getEmailProvider() {
    const choice = (ENV.EMAIL_PROVIDER || 'mailpit').toLowerCase();
    switch (choice) {
        case 'mailpit':
            return MailpitEmailProvider;
        case 'smtp':
        case 'gmail':
        case 'nodemailer':
            return SmtpEmailProvider;
        default:
            console.warn(
                `[email] Unknown EMAIL_PROVIDER="${choice}", falling back to mailpit.`
            );
            return MailpitEmailProvider;
    }
}
