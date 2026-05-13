import Stripe from 'stripe';
import { ENV } from './env.js';

if (!ENV.STRIPE_SECRET_KEY) {
    console.warn('[stripe] STRIPE_SECRET_KEY is not set. Payment endpoints will fail.');
}

export const stripe = new Stripe(ENV.STRIPE_SECRET_KEY ?? '');
