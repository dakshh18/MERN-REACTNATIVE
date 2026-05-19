import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from 'inngest/express';
import { inngest , functions } from './config/inngest.js';
import adminRoutes from './routes/admin.route.js';
import userRoutes from './routes/user.route.js';
import orderRoutes from './routes/order.route.js';
import reviewRoutes from './routes/review.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import authRoutes from './routes/auth.route.js';
import cors from 'cors';
const app = express();

const __dirname = path.resolve();

// We sit behind nginx — trust X-Forwarded-For so rate-limit + req.ip see the
// real client IP, not nginx's loopback.
app.set('trust proxy', 1);

// Security headers (HSTS, X-Frame-Options, no X-Powered-By, etc.).
// CSP is disabled because the admin SPA we serve in production loads scripts
// from Clerk / Sentry / Cloudinary; configuring CSP for those is a separate task.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(express.json());

// request logger for debugging
app.use((req, _res, next) => {
    console.log(`[req] ${req.method} ${req.originalUrl}`);
    next();
});

// CORS must run BEFORE clerkMiddleware so preflights and unauthenticated
// requests still get the right Access-Control-* headers on the response.
const allowedOrigins = (ENV.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // No Origin header: native mobile apps, curl, server-to-server. Allow.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));

// Per-IP rate limit on the API. 100 reqs / 15 min is loose enough not to bother
// real users on flaky connections retrying, tight enough that an unauthenticated
// loop can't hammer Mongo. Skipped in tests so the in-memory replica set isn't
// throttled by fixture setup.
app.use(
    '/api/',
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many requests, please try again later.' },
        skip: () => process.env.NODE_ENV === 'test',
    })
);

app.use(clerkMiddleware()); // adds auth object under the req => req.auth


app.use("/api/inngest", serve({client : inngest , functions}));

// Local email/password+OTP auth (coexists with Clerk OAuth).
app.use("/api/auth", authRoutes);

// for admin
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);




app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Server is running" });
})

// JSON 404 for any unmatched /api/* route. This MUST run before the production
// SPA fallback below — otherwise the SPA catch-all swallows /api/nonexistent
// and returns index.html with a 200, which is wrong for an API miss.
app.use('/api', (req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// In production, serve the built admin SPA from /admin/dist for any non-/api path.
// Guarded by an existsSync check: if the admin hasn't been built yet
// (e.g. fresh EC2 deploy), we skip static serving instead of 500ing
// on every unmatched GET. Run `npm run build` in admin/ to enable.
if (ENV.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "../admin/dist");
    const indexPath = path.join(distPath, "index.html");

    if (fs.existsSync(indexPath)) {
        app.use(express.static(distPath));
        app.get("/{*any}", (req, res) => {
            res.sendFile(indexPath);
        });
    } else {
        console.warn(
            `[startup] admin/dist not found at ${distPath} — skipping SPA static serving. ` +
            `Run 'npm run build' inside admin/ to enable.`
        );
    }
}

// Centralised error handler. Controllers that throw (or pass to next(err)) land
// here. Errors with a numeric `.status` or `.statusCode` are surfaced; everything
// else becomes 500. Stack traces are only included in non-production responses.
app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    console.error(`[error] ${req.method} ${req.originalUrl} → ${status}:`, err.message);

    const body = { message: err.message || 'Internal server error' };
    if (process.env.NODE_ENV !== 'production') {
        body.stack = err.stack;
    }
    res.status(status).json(body);
});

export { app };

const startServer = async () => {
    await connectDB();
    app.listen(ENV.PORT, () => {
        console.log(`Server is running on port ${ENV.PORT}`);
    });
}

// Only auto-start when run directly (e.g. `node src/server.js`). When tests
// import { app }, this branch is skipped so they can supply their own DB.
// fileURLToPath handles Windows drive letters; plain URL().pathname doesn't.
const entryPath = process.argv[1] && path.resolve(process.argv[1]);
const thisPath = fileURLToPath(import.meta.url);
if (entryPath === thisPath) {
    startServer();
}