import express from 'express';
import path from 'path';
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
import cors from 'cors';
const app = express();

const __dirname = path.resolve();

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

app.use(clerkMiddleware()); // adds auth object under the req => req.auth


app.use("/api/inngest", serve({client : inngest , functions}));

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
// make our app ready fior deployment
if (ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../admin/dist")));

    
    app.get("/{*any}", (req, res) => {
        res.sendFile(path.join(__dirname, "../admin", "dist", "index.html"));
    })
}

// app.listen(ENV.PORT, () => {
//     console.log(`Server is running on port ${ENV.PORT}`);
//     connectDB();
// });

const startServer = async () => {
    await connectDB();
    app.listen(ENV.PORT, () => {
        console.log(`Server is running on port ${ENV.PORT}`);
    });
}

startServer();