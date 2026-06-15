# MERN + React Native E-commerce

Full-stack e-commerce platform: an Express + MongoDB API, a React admin dashboard, and an Expo / React Native mobile app — sharing **dual authentication** (Clerk OAuth **and** a custom email + OTP + JWT flow), Stripe-backed checkout, and a Mongo replica-set deployment on AWS EC2 with HTTPS via Let's Encrypt.

[![CI](https://github.com/dakshh18/MERN-REACTNATIVE/actions/workflows/ci.yml/badge.svg)](https://github.com/dakshh18/MERN-REACTNATIVE/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

> **Live API health:** [`https://daksh-mern-shop.duckdns.org/api/health`](https://daksh-mern-shop.duckdns.org/api/health)

<!-- TODO(daksh): drop a hero screenshot / 10-sec GIF of the mobile checkout flow here -->

---

## Tech stack

| Layer | Stack |
|---|---|
| **Backend** | Node 20 · Express 5 · MongoDB Atlas (Mongoose 8) · **Dual auth: Clerk + custom email-OTP-JWT** (scrypt · HS256) · Stripe · Cloudinary · Inngest · Nodemailer · Zod · helmet · express-rate-limit · Vitest |
| **Admin (web)** | React 19 · Vite 7 · TanStack Query · Tailwind + DaisyUI · Clerk · Sentry |
| **Mobile** | React Native 0.81 · Expo SDK 54 · expo-router · NativeWind · TanStack Query · Stripe React Native · Clerk Expo · expo-secure-store · Expo Notifications · Sentry |
| **Infra** | AWS EC2 (Ubuntu) · nginx reverse proxy · Let's Encrypt · PM2 |
| **CI** | GitHub Actions (lint + typecheck + build + tests, 3 parallel jobs) |

---

## Features

- **Dual authentication, transparent to every route:**
  - **Clerk OAuth** (Google / Apple social sign-in), and
  - a **custom email + OTP + JWT** flow (register → 6-digit OTP by email → verify → HS256 JWT).
  Both clients send a `Authorization: Bearer <token>`; the server accepts either.
- Product browsing with images on Cloudinary, cart management, multi-address support.
- **Stripe Payment Sheet** checkout on mobile + cash-on-delivery fallback.
- **Server-verified payments**: the client only sends a `paymentIntentId`; the server independently re-computes the cart total and re-checks `intent.status === 'succeeded'`, `intent.metadata.userId`, and `intent.amount` before saving the order.
- **Atomic order creation** in a Mongo transaction — stock decrement, order insert, and cart clear are all-or-nothing.
- **Push notifications** via Expo for order-placed / shipped / delivered, with tap-to-deep-link to the order detail.
- **Admin dashboard** with revenue/order/customer stats, product CRUD (multipart upload to Cloudinary), and order-status workflow.
- **Inngest webhook** consumes Clerk `user.created` / `user.deleted` events and syncs Mongo.
- **Reviews** allowed only on delivered orders (verified server-side).
- **Hardening pass**: `helmet` security headers, `express-rate-limit` (global + tighter on OTP endpoints), centralized error handler that hides stack traces in production, JSON 404 for unmatched `/api/*`, and CORS locked to a comma-separated allow-list.

---

## Architecture

```
┌────────────────────┐         ┌────────────────────┐
│  React Native App  │         │   React (Vite)     │
│ (Expo, iOS+Android)│         │  Admin Dashboard   │
└─────────┬──────────┘         └─────────┬──────────┘
          │ HTTPS                        │ HTTPS
          │ Bearer token                 │ Bearer token
          │ (Clerk OR local JWT)         │ (Clerk OR local JWT)
          ▼                              ▼
     ┌──────────────────────────────────────────┐
     │     nginx (reverse proxy, TLS)           │
     │     daksh-mern-shop.duckdns.org          │
     └──────────────────┬───────────────────────┘
                        │ proxy_pass :3000
                        ▼
               ┌──────────────────┐
               │   Express API    │
               │  (PM2 managed)   │
               └────────┬─────────┘
                        │
      ┌─────────┬───────┼─────────┬──────────────┐
      ▼         ▼       ▼         ▼              ▼
 ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────────┐
 │ MongoDB │ │Stripe│ │ SMTP │ │Cloudinary│ │ Inngest  │
 │  Atlas  │ │ API  │ │ (OTP)│ │  images  │ │ (Clerk   │
 └─────────┘ └──────┘ └──────┘ └──────────┘ │ webhooks)│
                                            └──────────┘
```

---

## Repository layout

```
.
├── backend/                # Express 5 API
│   ├── src/
│   │   ├── controllers/    # admin, auth, cart, order, product, review, user
│   │   ├── models/         # Mongoose schemas (User, Cart, Order, OtpVerification, ...)
│   │   ├── routes/         # Express routers mounted under /api/*
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── middlewares/    # auth (Clerk + local JWT), validate (Zod), multer
│   │   ├── services/       # otp.service + email/SMS providers
│   │   ├── config/         # env, db, stripe, cloudinary, inngest
│   │   ├── utils/          # password (scrypt), jwt (HS256), phone, Expo push
│   │   └── server.js
│   └── tests/              # Vitest + supertest + mongodb-memory-server
│
├── admin/                  # React 19 + Vite 7 admin SPA
│   └── src/
│       ├── pages/          # Dashboard, Products, Orders, Customers, Login/Register/Verify
│       ├── components/     # Navbar, Sidebar, PageLoader
│       ├── layouts/        # DashboardLayout
│       └── lib/            # axios + bearer interceptor (Clerk → local JWT)
│
├── mobile/                 # Expo / React Native app
│   ├── app/                # File-based routing (expo-router)
│   │   ├── (auth)/         # Clerk + email/OTP sign-in screens
│   │   ├── (tabs)/         # Home, Cart, Profile
│   │   ├── account/        # Orders, Wishlist, Addresses, Notifications
│   │   └── checkout/       # Address → Review → Success
│   ├── components/         # Reusable UI
│   ├── hooks/              # useCart, useOrders, useProducts, usePayment, ...
│   └── lib/                # api.ts (axios + bearer interceptor)
│
└── .github/workflows/ci.yml
```

---

## Notable design decisions

These are the choices a reviewer should care about.

### 1. Dual authentication via a middleware fallback chain

`protectRoute` is a two-stage middleware: it first tries to resolve a user from a local HS256 JWT (`tryLocalAuth`); if that fails it falls through to Clerk's `requireAuth` plus a Mongo-provisioning step. Route handlers just read `req.user` and never care which method authenticated the request — so Clerk OAuth and the custom email/password flow coexist without per-route branching. The custom flow hashes passwords with Node's built-in `crypto.scrypt` (versioned, salted) and emails a 6-digit OTP that is **never** stored in plaintext — only a SHA-256 hash, with a 5-minute Mongo TTL index, an attempt cap, and a resend cooldown. `login/start` returns a generic 200 regardless of whether the account exists, to avoid user enumeration.

### 2. Atomic order creation with a race-safe stock guard

`createOrder` runs inside `session.withTransaction(...)`. Stock decrement uses a conditional `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` — a compare-and-swap. If two buyers race for the last unit, only one update matches; the loser gets `null` back, we throw, and the entire transaction rolls back (no order, no partial stock change, cart preserved). A dedicated test in [`backend/tests/order.test.js`](backend/tests/order.test.js) simulates exactly this race and verifies the rollback.

### 3. Server-side payment verification

The mobile app never tells the API "payment succeeded". It tells the API "here's a `paymentIntentId`". The server then calls `stripe.paymentIntents.retrieve(id)` and rejects unless **all three** of these hold:

- `intent.status === 'succeeded'`
- `intent.metadata.userId === user._id.toString()` (prevents replaying someone else's payment)
- `intent.amount === Math.round(server-side-recomputed-total * 100)` (prevents inflating the total client-side)

Stripe is verified **outside** the Mongo transaction (external network calls don't belong inside a transaction); the stock decrement, order insert, and cart clear all happen **inside** it.

### 4. Zod schemas at route boundaries

Every state-changing endpoint runs `validate(schema)` middleware before the controller. Schemas live in [`backend/src/schemas/`](backend/src/schemas/). Validation failures return 400 with `{ path, message }[]` so the client can show field-level errors.

### 5. CORS *before* the auth middleware

A subtle bug found during development: when `clerkMiddleware()` ran before `cors()`, unauthenticated requests received a redirect *without* `Access-Control-Allow-Origin` — the browser silently dropped the response and the admin appeared to hang on "...". Order matters; CORS is now the first middleware so even rejected requests carry the right headers.

### 6. Multi-origin CORS via comma-separated env

`CLIENT_URL` accepts a comma-separated list (e.g. `http://localhost:5173,https://daksh-mern-shop.duckdns.org`). The `origin` callback allows requests with no `Origin` header (mobile, curl, server-to-server) and rejects anything not in the list.

### 7. One bearer-token interceptor per client

Cross-origin auth requires the bearer token in `Authorization` because cookies don't cross origins by default. A single axios request interceptor on each client attaches the token on every request — Clerk's session token first, then a local JWT (from `expo-secure-store` on mobile, `localStorage` on admin) as a fallback. No per-page wiring.

### 8. CI gates every push

Three parallel jobs run on every push to `main`:

- **Admin** — eslint + Vite production build
- **Mobile** — `expo lint` + `tsc --noEmit`
- **Backend** — `node --check src/server.js` + `vitest run` (with cached mongodb-memory-server binary)

---

## Local development

```bash
git clone https://github.com/dakshh18/MERN-REACTNATIVE.git
cd MERN-REACTNATIVE
```

Each of the three apps has its own `.env`. Required keys per app:

**`backend/.env`**

```env
NODE_ENV=development
PORT=3000
DB_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=you@example.com

# Clerk OAuth
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Inngest (Clerk webhook sync)
INNGEST_SIGNING_KEY=...

# Custom email + OTP + JWT auth
JWT_SECRET=<openssl rand -hex 48>
AUTH_OTP_EXPIRY_MINUTES=5
AUTH_OTP_RESEND_COOLDOWN_SECONDS=60
AUTH_OTP_MAX_ATTEMPTS=5

# Email provider for OTP delivery (SMTP via nodemailer)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM="MERN Shop <no-reply@example.com>"
```

**`admin/.env`**

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3000/api
VITE_SENTRY_DSN=
```

**`mobile/.env`**

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=https://daksh-mern-shop.duckdns.org/api
```

Then in three separate terminals:

```bash
# Terminal 1 — API
cd backend && npm install && npm run dev

# Terminal 2 — Admin
cd admin && npm install && npm run dev      # → http://localhost:5173

# Terminal 3 — Mobile
cd mobile && npm install && npm start       # → opens Expo (needs a dev-client build for Stripe)
```

> **Note:** the mobile app uses a native Stripe module, so it can't run in Expo Go — build a dev client (`npx expo run:android` / `run:ios`).

Seed the database with sample products (optional):

```bash
cd backend && npm run seed:products
```

---

## Testing

```bash
cd backend
npm test            # one-shot run
npm run test:watch  # watch mode
```

The suite uses:

- **Vitest** as the runner (native ESM, fast).
- **`mongodb-memory-server`** to spin up a single-node replica set so the transactional `createOrder` path can be tested for real, not just mocked.
- **`supertest`** to hit the actual Express app — same code path as production.
- `vi.mock` to stub the genuinely external things (Clerk, Stripe).

Test files in [`backend/tests/`](backend/tests/):

- **`order.test.js`** — the standout. Mocks `Product.findOneAndUpdate` to return `null` on the transactional decrement (simulating a concurrent buyer claiming the last units) and verifies the transaction rolls back: zero orders, original stock, untouched cart.
- **`auth.test.js`** — phone normalization, OTP generation/expiry/attempt-cap, abandoned-signup reclaim, and no-enumeration login.
- **`cart.test.js`** — cart operations.

---

## Deployment

The production setup running at `daksh-mern-shop.duckdns.org`:

1. **EC2 Ubuntu instance** with an Elastic IP.
2. **nginx** on ports 80 and 443, reverse-proxying to the Node app on `:3000`.
3. **Let's Encrypt** TLS via certbot's nginx plugin; auto-renews via systemd timer.
4. **PM2** runs the Node app as a managed process, restarting on boot.
5. **Backend `.env`** lives on the box at `~/MERN-REACTNATIVE/backend/.env` (never committed).

Deployment cycle:

```bash
ssh ubuntu@<elastic-ip>
cd ~/MERN-REACTNATIVE
git pull
cd backend && npm ci --omit=dev          # devDeps are tests; not needed in prod
pm2 restart backend --update-env         # --update-env re-reads .env
```

To make the admin dashboard reachable at the same origin (no CORS needed in prod):

```bash
cd ~/MERN-REACTNATIVE/admin && npm ci && npm run build
# admin/dist/ now exists; server.js auto-detects it and serves it as a SPA fallback
```

If `admin/dist/` is missing the backend gracefully skips SPA serving (logs a warning once at startup) instead of 500-ing on every unmatched GET.

---

## Roadmap

- [ ] Stripe webhooks (`payment_intent.succeeded`, `charge.refunded`) for source-of-truth status, separate from the synchronous verification.
- [ ] Server-driven product search + filters + pagination on the public list endpoint.
- [ ] Responsive image variants via Cloudinary transformations.
- [ ] Swap the hand-rolled HS256 JWT for a vetted library (`jsonwebtoken`) for production hardening.
- [ ] E2E coverage: Playwright (admin) + Detox or Maestro (mobile).
- [ ] Move secrets from `.env` files to AWS SSM Parameter Store.
- [ ] CDN (Cloudflare) in front of the API for static-ish responses (`/api/products`).
- [ ] Replace DuckDNS with a real second-level domain.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Author

Built by [@dakshh18](https://github.com/dakshh18). Reach me at `pdaksh163@gmail.com`.
