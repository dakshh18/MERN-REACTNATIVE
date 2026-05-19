import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        testTimeout: 30000, // mongodb-memory-server can be slow on first download
        hookTimeout: 60000,
        // Run test files sequentially — each one uses a fresh in-memory replica set.
        // Parallel files would each spin up their own Mongo (slow + heavy).
        pool: 'forks',
        poolOptions: {
            forks: { singleFork: true },
        },
        // Vitest doesn't set NODE_ENV automatically. Set it so server.js can
        // detect tests (e.g. to skip rate limiting).
        env: {
            NODE_ENV: 'test',
        },
    },
});
