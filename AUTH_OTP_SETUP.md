# Email + Phone OTP authentication

A second, parallel auth flow that lives alongside the existing Clerk OAuth
(Google / Apple) login. Users register / sign in with **name + email +
password + Indian phone**, then verify a single 6-digit OTP that is sent to
**both their email and their phone**.

Clerk OAuth keeps working exactly as before — nothing on that path was
changed. The backend's `protectRoute` middleware now accepts **either**
auth token, so every existing `/api/*` route just works for local users too.

---

## 1. What got added

### Backend (`backend/`)

| File | Purpose |
| --- | --- |
| `src/models/user.model.js` (extended) | Adds `passwordHash`, `phoneNumber`, `phoneCountryCode`, `isOtpVerified`, `authProvider`. `clerkId` is now optional. |
| `src/models/otp.model.js` (new) | Stores hashed OTPs with TTL auto-expiry. |
| `src/utils/phone.js` | Indian phone normalization → E.164. |
| `src/utils/password.js` | scrypt-based password hashing (no extra dep). |
| `src/utils/jwt.js` | HS256 JWT sign/verify (no extra dep). |
| `src/services/otp.service.js` | OTP generate / hash / verify / cooldown. |
| `src/services/providers/email/mailpitEmailProvider.js` | Tiny plain-SMTP sender for Mailpit. |
| `src/services/providers/email/index.js` | Factory keyed on `EMAIL_PROVIDER`. |
| `src/services/providers/sms/mockSmsProvider.js` | Logs OTP to backend console. |
| `src/services/providers/sms/androidSmsGatewayProvider.js` | Posts to a self-hosted android-sms-gateway. |
| `src/services/providers/sms/index.js` | Factory keyed on `SMS_PROVIDER`. |
| `src/controllers/auth.controller.js` | All five new endpoints. |
| `src/routes/auth.route.js` | Mounted at `/api/auth`. |
| `src/schemas/auth.schema.js` | zod validation. |
| `src/middlewares/localAuth.middleware.js` | `requireLocalAuth`, `tryLocalAuth`. |
| `src/middlewares/auth.middleware.js` (extended) | `protectRoute` now accepts local JWT **or** Clerk. |
| `tests/auth.test.js` | 22 tests covering validation, OTP flow, providers, cooldown. |

### Mobile (`mobile/`)

| File | Purpose |
| --- | --- |
| `hooks/useLocalAuth.ts` | Token + user persisted in `expo-secure-store`. |
| `app/(auth)/register.tsx` | Register screen. |
| `app/(auth)/login.tsx` | Email/phone + password login screen. |
| `app/(auth)/verify-otp.tsx` | OTP entry with resend cooldown. |
| `app/(auth)/index.tsx` (extended) | Adds links to email login & register. |
| `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx` (extended) | Recognize both Clerk and local sign-in. |
| `app/(tabs)/profile.tsx` (extended) | Signs out of both systems; falls back to local user. |
| `lib/api.ts` (extended) | Axios interceptor sends local JWT when Clerk has no token. |

### Admin (`admin/`)

| File | Purpose |
| --- | --- |
| `src/lib/localAuth.jsx` | React context + localStorage persistence. |
| `src/pages/RegisterPage.jsx` | Register page (DaisyUI). |
| `src/pages/EmailLoginPage.jsx` | Email/phone + password page. |
| `src/pages/VerifyOtpPage.jsx` | OTP page. |
| `src/pages/LoginPage.jsx` (extended) | Adds links to email login & register. |
| `src/App.jsx` (extended) | Routes + signed-in gate covers both auth methods. |
| `src/main.jsx` (extended) | Wraps tree in `LocalAuthProvider`. |
| `src/lib/AxiosAuthProvider.jsx` (extended) | Falls back to local JWT. |
| `src/components/Navbar.jsx` (extended) | Adds sign-out button for local users. |

---

## 2. New API endpoints

All under `/api/auth`. All accept JSON, all OTP-sending endpoints are
behind an extra 20-req/15-min per-IP limiter on top of the global limiter.

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register/start` | `{ name, email, password, phoneNumber }` | Creates an unverified user. Emails + SMS the OTP. |
| POST | `/auth/register/verify` | `{ email \| phoneNumber, otp }` | Returns `{ token, user }`. |
| POST | `/auth/login/start` | `{ email \| phoneNumber, password }` | Issues a fresh OTP (always 200 on bad pw — no enumeration). |
| POST | `/auth/login/verify` | `{ email \| phoneNumber, otp }` | Returns `{ token, user }`. |
| POST | `/auth/otp/resend` | `{ email \| phoneNumber, purpose }` | 60s per-user cooldown. |
| GET | `/auth/me` | _Bearer token_ | Returns the local user. |

### Auth model

- Clients send `Authorization: Bearer <token>`.
- The token is **either** a Clerk session token (existing) or our HS256 JWT
  (issued by `/register/verify` and `/login/verify`).
- `protectRoute` tries the local JWT first, then falls through to Clerk.

---

## 3. New environment variables

See [`backend/.env.example`](backend/.env.example) for the full list with
explanations. Minimum required for the local-auth flow to start working:

```dotenv
JWT_SECRET=replace-me-with-a-long-random-string

AUTH_OTP_EXPIRY_MINUTES=5
AUTH_OTP_RESEND_COOLDOWN_SECONDS=60
AUTH_OTP_MAX_ATTEMPTS=5

EMAIL_PROVIDER=mailpit
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM="Your App <no-reply@local.test>"

SMS_PROVIDER=mock
```

Generate a fresh `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 4. Running locally

### 4.1 Mailpit (email OTP catcher)

Mailpit is a tiny binary that accepts plain SMTP on `:1025` and shows a web
inbox on `:8025`. Pick whichever install method you like:

```bash
# Docker (easiest):
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit

# Or download a release binary:
#   https://mailpit.axllent.org/docs/install/
```

Open <http://localhost:8025> — that's your inbox.

### 4.2 Backend

```bash
cd backend
cp .env.example .env   # then fill in DB_URL, JWT_SECRET, etc.
npm install
npm run dev
```

### 4.3 Mobile

Already configured via `mobile/.env`'s `EXPO_PUBLIC_API_URL`. Run as usual:

```bash
cd mobile
npm install
npm start
```

### 4.4 Admin SPA

```bash
cd admin
npm install
npm run dev
```

The new pages are at `/email-login`, `/register`, `/verify-otp`; the Clerk
sign-in page at `/login` now has links to both.

---

## 5. Testing the flow end-to-end

1. Start the backend (`npm run dev` in `backend/`).
2. Start Mailpit and open <http://localhost:8025>.
3. In the mobile app or admin, hit **Create account**, fill in:
   - any name (≥ 2 chars)
   - any email
   - a password (≥ 8 chars)
   - your phone number (Indian, starts with 6/7/8/9)
4. You'll be sent to the OTP screen. To find the OTP:
   - **Email**: appears in the Mailpit inbox at <http://localhost:8025>.
   - **SMS (Mock)**: printed loudly in the backend terminal:
     ```
     ============================================================
     [sms:mock]  📱  OTP for +919876543210: 482917
     ============================================================
     ```
5. Enter the OTP → you're signed in. The mobile app stores the JWT in
   `expo-secure-store`; the admin stores it in `localStorage`.
6. Tap **Resend OTP** — backend enforces a 60-second cooldown.

---

## 6. Switching SMS providers

### Mock (default)
```dotenv
SMS_PROVIDER=mock
```
OTP prints in the backend console. **Never use in production.**

### Android SMS Gateway (optional, open-source)

[`capcom6/android-sms-gateway`](https://github.com/capcom6/android-sms-gateway)
is open-source software that turns an Android phone into a tiny REST SMS
gateway. **It is not "free SMS"** — every message goes through the SIM in
your phone and your carrier still charges per SMS.

To enable:

1. Install the gateway app on an Android phone with a SIM.
2. Note the local URL it exposes (e.g. `http://192.168.1.42:8080`).
3. Set the API key the app shows you.
4. Update `backend/.env`:
   ```dotenv
   SMS_PROVIDER=android-sms-gateway
   SMS_GATEWAY_BASE_URL=http://192.168.1.42:8080
   SMS_GATEWAY_API_KEY=<the bearer token>
   ```
5. Restart the backend. The provider in
   `src/services/providers/sms/androidSmsGatewayProvider.js` POSTs to
   `${SMS_GATEWAY_BASE_URL}/messages` with the standard
   `{ phoneNumbers: [...], message }` payload.

---

## 7. Security notes

- **OTPs are never returned in API responses** and **never stored raw** —
  only as a SHA-256 hash peppered with `JWT_SECRET`.
- Passwords are hashed with Node's built-in `scrypt` (memory-hard, no
  bcrypt/argon2 dep needed).
- Resend cooldown (60s default) + per-OTP attempt cap (5) + global IP
  rate-limit + a tighter OTP-endpoint limiter all stack.
- `/login/start` returns the same `200 { message: "If the details are
  valid, an OTP has been sent…" }` whether or not the account exists / the
  password matched — so the endpoint can't be used to enumerate users.
- Mobile tokens live in `expo-secure-store`; admin tokens in
  `localStorage` (same place Clerk already keeps its own session token).
- The `OtpVerification` collection has a TTL index — expired rows are
  auto-deleted by MongoDB.

---

## 8. Assumptions / known limits

- Passwords are scrypt-hashed (built-in). Tune parameters in
  `utils/password.js` if you ever want more cost per hash.
- The Mailpit provider is a plain-SMTP-no-auth-no-TLS client. To use real
  SMTP (Gmail, SES, …) add a new provider that uses `nodemailer` and wire
  it into `services/providers/email/index.js`.
- The OTP-hashing pepper reuses `JWT_SECRET` to keep the env surface small.
  If you ever rotate `JWT_SECRET`, existing OTPs become invalid (they
  expire in 5 minutes anyway).
- The schema's transform for phone numbers normalizes to E.164 but the
  project's `validate` middleware doesn't currently write the parsed body
  back to `req.body`. The controllers re-normalize defensively — keep that
  if you change the middleware later.

---

## 9. Tests

```bash
cd backend
npm test
```

Covers: phone normalization, OTP generation/hash/compare, validation
errors, register → verify happy path, wrong OTP attempts → lockout, OTP
expiry, login start (success + bad-password no-enumeration), login verify,
phone-based login, resend cooldown (locked + elapsed).
