# Carton Planner — Full-Stack SaaS Application

A production-ready SaaS carton sheet size calculator with authentication, subscriptions, device limiting, and Razorpay payment integration.

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Route Handlers
- **Database:** MySQL + Prisma ORM
- **Auth:** JWT-based (cookies + headers) with bcrypt password hashing
- **Payments:** Razorpay (orders, verification, webhooks)
- **Fonts:** DM Sans, DM Mono, Syne (Google Fonts)

---

## Project Structure

```
carton-planner/
├── prisma/
│   ├── schema.prisma           # DB schema
│   └── seed.ts                 # Seed subscription plans
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (AuthProvider)
│   │   ├── globals.css         # Global styles + design tokens
│   │   ├── page.tsx            # Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── calculator/page.tsx
│   │   ├── history/page.tsx
│   │   ├── pricing/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signup/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       ├── calculations/route.ts
│   │       ├── devices/route.ts
│   │       ├── payments/
│   │       │   ├── create-order/route.ts
│   │       │   ├── verify/route.ts
│   │       │   └── webhook/route.ts
│   │       └── subscriptions/
│   │           ├── plans/route.ts
│   │           └── purchase-device/route.ts
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── AppLayout.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx         # Auth context + hook
│   │   ├── useCalculator.ts
│   │   └── useRazorpay.ts
│   ├── lib/
│   │   ├── prisma.ts           # Prisma singleton
│   │   ├── jwt.ts              # JWT sign/verify
│   │   ├── auth.ts             # Auth helpers
│   │   ├── carton-calculator.ts # Core calculation logic
│   │   ├── razorpay.ts         # Razorpay client + helpers
│   │   └── api-response.ts     # Standardized responses
│   ├── middleware.ts            # Route protection middleware
│   └── types/index.ts          # TypeScript types
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MySQL 8.0+
- A Razorpay account (test keys available free)

### 2. Clone and Install

```bash
git clone <your-repo>
cd carton-planner
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="mysql://root:password@localhost:3306/carton_planner"
JWT_SECRET="your-minimum-32-character-secret-key-here"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"

# Get these from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

EXTRA_DEVICE_PRICE=19900
```

### 4. Create the Database

```bash
mysql -u root -p -e "CREATE DATABASE carton_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 5. Run Migrations

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed subscription plans
```

Or with migrations (recommended for production):
```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 6. Run the Dev Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## Razorpay Integration

### Test Keys Setup

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Test Key
3. Copy `Key ID` and `Key Secret` to your `.env`

### Payment Flow

```
User clicks Subscribe
    ↓
POST /api/payments/create-order
    → Creates Razorpay order
    → Stores Payment record (status: "created")
    ↓
Razorpay checkout modal opens
    ↓
User completes payment
    ↓
POST /api/payments/verify
    → Verifies HMAC signature
    → Updates Payment record (status: "paid")
    → Creates/extends Subscription
    ↓
User gets access
```

### Webhook Setup (Production)

1. In Razorpay dashboard → Webhooks → Add New Webhook
2. URL: `https://yourdomain.com/api/payments/webhook`
3. Events: `payment.captured`, `payment.failed`
4. Secret: Add to `RAZORPAY_WEBHOOK_SECRET` in `.env`

The webhook provides redundancy — if the user closes the browser before verification completes, the webhook will still activate their subscription.

---

## Feature Documentation

### Authentication

- **Signup**: Creates user with 1-day trial, issues JWT cookie
- **Login**: Validates password, checks device limit, creates device session
- **JWT**: Stored in httpOnly cookie (`auth_token`) and optionally localStorage
- **Middleware**: Verifies JWT on all protected routes before hitting handlers

### Subscription Access Logic

```
hasAccess = (trialEndsAt > now) OR (subscription.status == "active" AND subscription.endDate > now)
```

Trial starts on signup and lasts 24 hours. After expiry, calculator is locked until a plan is purchased.

### Device Limiting

- Each login creates a `DeviceSession` record with a UUID `deviceId`
- On login, active device count is checked against `subscription.maxDevices` (default: 2)
- Device `lastActive` is updated on each API call
- Users can remove devices from the dashboard

### Carton Calculation Logic

Located in `src/lib/carton-calculator.ts`:

| Style | Formula |
|---|---|
| Self Lock, Tuck End, Snap Lock | Width = 2L + 2W + PF · Height = H + 2×TF |
| Crash Lock | Width = 2L + 2W + PF · Height = H + TF + 0.5W + 5mm |
| Seal End | Width = 2L + 2W + PF · Height = H + 1.5×0.75W |

Returns 3–4 layouts: grain long, grain short, with 2% trim allowance, and a 2-up layout if dimensions allow.

---

## Database Schema Summary

| Table | Purpose |
|---|---|
| `users` | User accounts with trial expiry |
| `subscriptions` | Active subscription per user |
| `device_sessions` | Active device tracking |
| `calculations` | Full calculation history |
| `payments` | Razorpay payment records |
| `plans` | Available subscription plans |

---

## Subscription Plans (seeded)

| Plan | Duration | Price | Devices |
|---|---|---|---|
| Monthly | 30 days | ₹499 | 2 |
| Quarterly | 90 days | ₹1,299 | 2 |
| Yearly | 365 days | ₹3,999 | 3 |
| Extra Device | — | ₹199 | +1 |

---

## Production Deployment

### Environment

- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET` (32+ random chars)
- Switch to Razorpay live keys
- Set `NEXT_PUBLIC_APP_URL` to your domain

### Database

```bash
npx prisma migrate deploy   # Run pending migrations
npm run db:seed             # Seed plans if first deploy
```

### Build

```bash
npm run build
npm start
```

### Recommended Stack

- **Host:** Vercel (frontend + API) or Railway (full-stack)
- **DB:** PlanetScale or Railway MySQL
- **Domain:** Configure with proper SSL for Razorpay webhooks

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| POST | `/api/auth/logout` | Cookie | Invalidate session |
| GET | `/api/auth/me` | Cookie | Get current user |

### Calculator

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/calculations` | JWT | Run calculation (requires access) |
| GET | `/api/calculations` | JWT | Get history (paginated) |

### Devices

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/devices` | JWT | List active devices |
| DELETE | `/api/devices?deviceId=xxx` | JWT | Remove a device |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-order` | JWT | Create Razorpay order |
| POST | `/api/payments/verify` | JWT | Verify payment signature |
| POST | `/api/payments/webhook` | None* | Razorpay webhook handler |

### Subscriptions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/subscriptions/plans` | No | Get available plans |
| POST | `/api/subscriptions/purchase-device` | JWT | Buy extra device slot |

---

## Security Checklist

- [x] Passwords hashed with bcrypt (cost factor 12)
- [x] JWT stored in httpOnly cookie (XSS-safe)
- [x] Razorpay signature verified server-side (HMAC-SHA256)
- [x] Webhook signature verified with secret
- [x] All inputs validated with Zod
- [x] Device session invalidated on logout
- [x] API routes protected by middleware
- [x] Environment secrets never exposed to client
- [x] Database cascades on user deletion

---

## License

MIT
