import Stripe from 'stripe';
import { ENV } from './env.js';

if (!ENV.STRIPE_SECRET_KEY) {
    console.warn('[stripe] STRIPE_SECRET_KEY is not set. Payment endpoints will fail at request time.');
}

// Stripe's SDK throws at construction on an empty string ("Neither apiKey nor
// config.authenticator provided"), so we feed it a non-empty placeholder when
// the env var is missing (CI without secrets, fresh `npm test` without .env, etc.).
// Real API calls with this placeholder would fail authentication — which is the
// correct production behavior if someone forgot to set the env var.
export const stripe = new Stripe(
    ENV.STRIPE_SECRET_KEY || 'sk_test_placeholder_module_load_only'
);

