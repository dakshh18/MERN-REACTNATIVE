import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        testTimeout: 30000, // mongodb-memory-server can be slow on first download
        hookTimeout: 60000,
        // Run test files sequentially — each one uses a fresh in-memory replica set.
        // Parallel files would each spin up their own Mongo (slow + heavy).
        pool: 'forks',
        // Vitest doesn't set NODE_ENV automatically. Set it so server.js can
        // detect tests (e.g. to skip rate limiting) and so our local-auth bits
        // have the few env vars they require even without backend/.env.
        env: {
            NODE_ENV: 'test',
            JWT_SECRET: 'test-secret-do-not-use-in-prod',
            AUTH_OTP_EXPIRY_MINUTES: '5',
            AUTH_OTP_RESEND_COOLDOWN_SECONDS: '60',
            AUTH_OTP_MAX_ATTEMPTS: '5',
        },
    },
});
