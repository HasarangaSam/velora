# Velora — Enterprise Full-Stack E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20RateLimit-dc382d?style=flat&logo=redis)](https://redis.io/)

**Velora** is a production-grade, full-stack fashion e-commerce web application engineered with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **PostgreSQL**, and **Prisma ORM 7**. It combines an aesthetic storefront, customer account workflows, an inventory-aware cart and checkout engine, Sri Lankan localized payments (PayHere), and a comprehensive administration control center featuring interactive data visualizations, fulfillment queues, and review moderation.

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Core Business Logic & Systems](#core-business-logic--systems)
  - [1. Order Fulfillment & Warehouse Pipeline](#1-order-fulfillment--warehouse-pipeline)
  - [2. Cart Engine & State Reconciliation](#2-cart-engine--state-reconciliation)
  - [3. Checkout Idempotency & Financial Accuracy](#3-checkout-idempotency--financial-accuracy)
  - [4. PayHere Payment Webhook & Reconciliation](#4-payhere-payment-webhook--reconciliation)
  - [5. Dynamic Promotion & Coupon Engine](#5-dynamic-promotion--coupon-engine)
  - [6. Verified-Purchase Review & Moderation Flow](#6-verified-purchase-review--moderation-flow)
  - [7. Real-Time Notification Lifecycle](#7-real-time-notification-lifecycle)
  - [8. Session Security & Auth Versioning](#8-session-security--auth-versioning)
  - [9. Sri Lankan Localization](#9-sri-lankan-localization)
- [Admin Workspace & Analytics](#admin-workspace--analytics)
- [Technology Stack](#technology-stack)
- [Database Domain Model](#database-domain-model)
- [Application Routes & API Surface](#application-routes--api-surface)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Docker & Production Deployment](#docker--production-deployment)
- [Security & Operational Architecture](#security--operational-architecture)

---

## Architectural Overview

```mermaid
flowchart TD
  subgraph Client [Client Tier]
    Browser["Next.js 16 Client Components\nZustand (Guest Cart) | Reactive Hooks"]
  end

  subgraph Edge [Application & Routing Tier]
    RSC["React Server Components (RSC)\nData Fetching & Page Rendering"]
    Actions["Server Actions\nMutations & Form Handlers"]
    API["Next.js Route Handlers\nREST Endpoints & Webhooks"]
  end

  subgraph Security [Security & Validation Layer]
    Zod["Zod 4 Runtime Validation"]
    Auth["NextAuth.js v5 (JWT Strategy)\nRole Checks & Session Versioning"]
    RateLimiter["Redis Sliding Window Rate Limiting"]
  end

  subgraph Data [Data & Storage Tier]
    Prisma["Prisma ORM 7 + PG Driver Adapter"]
    Postgres[("PostgreSQL\nRelational Database")]
    Redis[("Redis\nCatalog Cache & Rate Limit Counters")]
  end

  subgraph Integrations [External Cloud Providers]
    Cloudinary["Cloudinary CDN\nImage Hosting & Transformations"]
    PayHere["PayHere Payment Gateway\nHosted Checkout & Signed IPN"]
    SMTP["Nodemailer / SMTP\nOTPs, Resets & Order Receipts"]
  end

  Browser <-->|HTTP / HTML / JSON| Edge
  Edge --> Security
  Security --> Prisma
  Security --> Redis
  Prisma --> Postgres
  Actions --> Cloudinary
  Actions --> SMTP
  API <--> PayHere
```

---

## Core Business Logic & Systems

### 1. Order Fulfillment & Warehouse Pipeline

Orders progress through a strict, deterministic finite state machine designed to eliminate lost or unfulfilled orders:

$$\text{PENDING} \longrightarrow \text{CONFIRMED} \longrightarrow \text{PROCESSING} \longrightarrow \text{SHIPPED} \longrightarrow \text{DELIVERED} \quad (\text{or } \text{CANCELLED})$$

- **`PENDING`**: Placed by customer; awaiting payment gateway callback or bank clearance.
- **`CONFIRMED` (Needs Processing)**: Payment verified or approved; **critical warehouse stage**. The order is ready for item retrieval and packaging.
- **`PROCESSING`**: Warehouse personnel have claimed the order, verified items against inventory, and are packaging it for dispatch.
- **`SHIPPED`**: Package handed over to courier partner; tracking details dispatched to customer.
- **`DELIVERED`**: Order safely delivered and closed.
- **`CANCELLED`**: Cancelled before shipping; inventory is replenished if previously deducted.

#### Warehouse Protection Features
- **Sidebar Badge Alerts**: Both the desktop and mobile admin navigation display a dynamic, animated badge counter showing exact count of orders currently in `CONFIRMED` state awaiting processing.
- **Priority Fulfillment Queue**: The Admin Dashboard features an "Action Required" queue prioritizing confirmed orders ordered by **oldest first**. Orders waiting longer than 12 hours display a warning badge, and orders $> 24$ hours display an urgent alert.
- **1-Click Processing**: Admins can transition an order from `CONFIRMED` to `PROCESSING` with a single click from the dashboard or orders list, notifying the customer immediately.

---

### 2. Cart Engine & State Reconciliation

Velora uses a **hybrid client-server cart architecture** ensuring zero friction for guests alongside database durability for authenticated users:

1. **Guest Browsing**: Products and variants are saved in a client-side Zustand store persisted to `localStorage`.
2. **Authentication Reconciliation (`CartSync`)**: Upon login or registration, the client posts guest cart contents to `/api/cart/sync`.
3. **Inventory Sanity Check**: The server inspects each item against active product status and live variant stock:
   - If stock is sufficient: Items are upserted into the user's relational `CartItem` table.
   - If stock is insufficient: Quantities are automatically capped at maximum available stock.
   - If variant or product was disabled/deleted: The item is removed and customer notified.
4. **Server-Authoritative Pricing**: The browser **never** provides line item prices or order totals. All calculations fetch active variant prices directly from the database.

---

### 3. Checkout Idempotency & Financial Accuracy

E-commerce checkout double-submissions and network retries can cause duplicate orders and double-charges. Velora implements bulletproof checkout idempotency:

- **Client Fingerprinting**: The checkout client creates a unique UUID `checkoutRequestKey` persisted across retry attempts for that specific basket.
- **Cryptographic Request Hash**: The server computes a SHA-256 hash of the normalized payload (user ID, variant IDs, quantities, address, coupon).
- **Relational Uniqueness Constraints**:
  - `Order.orderNumber` is unique (generated with format `VEL-YYYYMMDD-XXXX`).
  - `Order.checkoutRequestKey` has a unique database index.
- **Duplicate Prevention**: If a request with an existing `checkoutRequestKey` arrives:
  - If the hash matches: The existing order is returned safely without recreation.
  - If the payload was altered: The request is rejected as an invalid idempotency conflict.
- **Immutable Historical Snapshots**: Line items (`OrderItem`) snapshot `name`, `size`, `colour`, and unit `price` at checkout time. Addresses are copied as snapshot text fields into `Order`. Future price updates or catalog deletions never alter historical financial records.

---

### 4. PayHere Payment Webhook & Reconciliation

Online payments integrate with Sri Lanka's **PayHere** gateway using hosted checkout and cryptographically validated asynchronous server-to-server IPN (Instant Payment Notification):

1. **Client Submission**: Order details are compiled with merchant credentials and submitted via an auto-submitting POST form to PayHere.
2. **Asymmetric MD5 Signature Verification**: PayHere transmits callback parameters to `/api/payments/payhere/notify`. The server verifies the provider signature:
   $$\text{Signature} = \text{MD5}(\text{merchant\_id} + \text{order\_id} + \text{payhere\_amount} + \text{payhere\_currency} + \text{status\_code} + \text{MD5}(\text{merchant\_secret}))$$
3. **Database Transaction Execution**: Upon valid signature and `status_code === 2` (Success), an atomic database transaction executes:
   - Sets `Payment.status = PAID` and stores `providerId`.
   - Sets `Order.status = CONFIRMED` and `Order.paymentStatus = PAID`.
   - Decrements stock from each purchased `ProductVariant`.
   - Increments coupon `usedCount` and records `CouponUsage`.
   - Triggers customer payment receipt email via Nodemailer.
   - Dispatches in-app notification to all store administrators.
4. **Client Return Security**: The browser redirect (`/checkout/success`) is treated as a presentation page only; financial state is updated exclusively by the signed webhook.

---

### 5. Dynamic Promotion & Coupon Engine

Velora includes a coupon verification system supporting flexible business promotions:

- **Discount Types**:
  - `PERCENTAGE`: e.g. 15% off cart subtotal with optional `maximumDiscount` cap.
  - `FIXED_AMOUNT`: e.g. LKR 1,500 off.
- **Validation Rules**:
  - Code existence and case-insensitive matching.
  - Date boundaries: `startsAt` and `expiresAt`.
  - Minimum spend: Cart subtotal must meet `minimumOrderValue`.
  - Global budget: `usedCount < usageLimit`.
  - Per-user protection: Checks `CouponUsage` records to enforce `perUserLimit`.
- **First-Time Buyer Incentive**: Welcomes new shoppers with a featured welcome promo code on the homepage hero banner.

---

### 6. Verified-Purchase Review & Moderation Flow

To prevent spam and maintain high store trust, Velora enforces strict customer review rules:

- **Verified Purchase Gatekeeper**: Customers can only review a product if they have at least one paid order (`paymentStatus: PAID`) containing that product.
- **Review Lifecycle**: Newly created or edited customer reviews enter `status: PENDING`.
- **Public Visibility Filtering**: Storefront product pages filter reviews strictly by `status: APPROVED`.
- **Admin Moderation Desk (`/admin/reviews`)**:
  - Displays full review comments, customer email, rating, and verified purchase badge.
  - Quick filter tabs: **All Reviews**, **Awaiting Review (Pending)**, **Published (Approved)**, and **Rejected**.
  - One-click actions to **Approve**, **Reject**, or permanently **Delete** reviews.
  - Deep-linked review resolution: Review notifications link directly to `/admin/reviews?reviewId=...` highlighting the targeted review.
  - Moderating or deleting a review automatically updates unread admin notifications.

---

### 7. Real-Time Notification Lifecycle

In-app notification system keeping customers and administrators synchronized without noisy polling:

- **Targeted Notification Types**:
  - **Admins**: New orders placed, customer reviews awaiting moderation.
  - **Customers**: Order confirmed, order processing, order shipped, order delivered.
- **Event-Driven UI Synchronizer**: The client header component (`NotificationBell`) listens to:
  - Custom browser events (`notifications:refresh`) triggered instantly on Server Actions.
  - Route navigation changes (`usePathname()`).
  - Window focus events and a 45-second background interval.
- **Read State Management**: Notifications display unread indicators and timestamps. Clicking a notification or marking all as read performs immediate optimistic updates backed by `/api/notifications` PATCH requests.

---

### 8. Session Security & Auth Versioning

- **Credential Authentication**: Passwords hashed with `bcrypt` (10 rounds).
- **Email Verification**: Registration sends a 6-digit OTP via SMTP with an expiration TTL (15 minutes). Unverified accounts cannot sign in.
- **Session Versioning (`sessionVersion`)**: Each `User` model stores a `sessionVersion` integer. Changing a password or resetting credentials increments this integer. Existing JWT sessions containing an older `sessionVersion` are immediately rejected on their next request.
- **Role Enforcement**: Helper utilities (`requireUser`, `requireAdmin`) ensure clean server-side guards across Route Handlers and Server Actions.

---

### 9. Sri Lankan Localization

- **Districts Dropdown**: Checkout address forms replace arbitrary text inputs with Sri Lanka's 25 official administrative districts (`Colombo`, `Gampaha`, `Kandy`, `Galle`, etc.).
- **Currency & Formatting**: Standardized presentation in Sri Lankan Rupees (`LKR` / `Rs.`) with locale-aware thousand separators.
- **Phone Validation**: Validates Sri Lankan mobile phone formats (`07XXXXXXXX` or `+94XXXXXXXXX`).
- **Support Integration**: Direct WhatsApp support launcher pre-configured with Sri Lankan dial codes.

---

## Admin Workspace & Analytics

The administration portal at `/admin` is equipped with real-time operational controls and visual charts:

### 1. Interactive Analytics & Visual Charts (Zero Third-Party Dependency)
Constructed using handcrafted, dependency-free React 19 SVGs:
- **Revenue & Sales Trend Area Chart**: Displays 7-day and 30-day timelines. Includes metric switcher (*Revenue LKR* vs *Order Volume*), cubic bezier curved paths, gradient fills, and interactive crosshair hover tooltips.
- **Order Fulfillment Donut Chart**: Visualizes fulfillment distribution (*Delivered, Confirmed, Processing, Shipped, Pending, Cancelled*). Hovering highlights slices and updates the center metric readout with count and percentage share.
- **Category Performance Bar Chart**: Ranks product categories by items sold and revenue generated with proportional colored progress bars.
- **Customer Satisfaction & Rating Breakdown**: Displays overall rating score (out of 5.0), dynamic gold stars, and 5-star to 1-star distribution bars.

### 2. Operational Workspaces
- **Orders Desk**: Filter by status (*Needs Processing, Processing, Shipped, Delivered, Pending, Cancelled*), search by order number or customer, view item breakdowns, and trigger one-click status transitions.
- **Catalog Management**: Create and edit products, manage size/colour variants, track individual stock levels, set featured flags, and upload images to Cloudinary with sorting order and primary image selection.
- **Category Hierarchy**: Organize parent categories and subcategories with customizable URL slugs.
- **Coupon Manager**: Create percentage or fixed discount coupons, configure usage limits, and set expiration dates.
- **User Management**: Search customer accounts, inspect roles, and promote or demote administrator permissions.

---

## Technology Stack

| Layer | Technologies |
| --- | --- |
| **Framework** | Next.js 16.3 (App Router), React 19.2, TypeScript 5 |
| **Styling & UI** | Tailwind CSS v4, Lucide React icons, Bundled Inter font |
| **Database & ORM** | PostgreSQL 16, Prisma ORM 7.10, `@prisma/adapter-pg` driver |
| **Authentication** | Auth.js / NextAuth v5 Beta, Prisma Adapter, JWT Session Strategy |
| **Client State** | Zustand 5 with `localStorage` persistence |
| **Caching & Rate Limiting** | Redis via `ioredis` (sliding window rate limiting, fail-open resiliency) |
| **Media & Images** | Cloudinary CDN |
| **Email Delivery** | Nodemailer over SMTP (HTML email templates) |
| **Payment Gateway** | PayHere (Sandbox and Live payment support, signed webhooks) |
| **Validation** | Zod 4 |
| **Unit Testing** | Vitest 3 |
| **DevOps & Containers** | Docker (multi-stage build), GitHub Actions CI |

---

## Database Domain Model

```text
User ────┬──< Account
         ├──< Address ─────────────< Order
         ├──< Cart ────────────────< CartItem ────> ProductVariant
         ├──< WishlistItem ───────────────────────> Product
         ├──< Order ───────────────┬──< OrderItem ─> ProductVariant
         │                         └─── Payment
         ├──< CouponUsage ────────> Coupon
         ├──< ProductReview ──────────────────────> Product
         └──< Notification

Category ──< Category (Self-hierarchical subcategories)
    │
    └──< Product ──┬──< ProductVariant
                   ├──< ProductImage (Cloudinary)
                   ├──< ProductReview
                   └──< WishlistItem
```

### Relational Schema Summary

- **`User`**: Identity model storing role (`USER` | `ADMIN`), bcrypt password hash, verification status, and `sessionVersion`.
- **`Product` & `ProductVariant`**: Products contain high-level details, category relations, and Cloudinary gallery images. Pricing and inventory exist strictly at the variant level (`size` + `colour` + `price` + `stock`).
- **`Order` & `OrderItem`**: Captures delivery address snapshot, shipping costs, applied coupon code, subtotal, and total. Order items capture unit price and variant snapshot at purchase time.
- **`Payment`**: 1-to-1 relation with `Order`. Records PayHere transaction ID, status (`PENDING`, `PAID`, `FAILED`), currency, and amount.
- **`Coupon` & `CouponUsage`**: Configurable promotional rules. Usage is tracked per user and order to enforce usage limits.
- **`ProductReview`**: Gated review records containing rating (1–5), verified purchase flag, and moderation status (`PENDING`, `APPROVED`, `REJECTED`).
- **`Notification`**: In-app notifications with target recipient, title, message, link, and timestamped `readAt` field.

---

## Application Routes & API Surface

### Storefront & Customer Routes

| Route | Type | Description |
| --- | --- | --- |
| `/` | Server Component | Homepage featuring rotating hero carousel, promotions, curated collections, and featured products. |
| `/shop` | Server Component | Product catalog with category filters, price range sliders, search input, and sorting. |
| `/products/[slug]` | Server Component | Product detail view with gallery, size/colour selection, stock counters, reviews, and Buy Now button. |
| `/cart` | Client Component | Interactive shopping cart drawer with quantity adjustments and checkout trigger. |
| `/checkout` | Client Component | Delivery address selection, Sri Lankan district picker, coupon input, and price summary. |
| `/checkout/payment` | Server/Client | Intermediary secure PayHere checkout form generation. |
| `/checkout/success` | Server Component | Order receipt presentation page. |
| `/account/orders` | Server Component | Customer order history with fulfillment tracking. |
| `/account/wishlist` | Server Component | Customer saved wishlist items with add-to-cart shortcuts. |
| `/account/reviews` | Server Component | Customer product review history and pending review statuses. |

### Admin Workspace Routes (`/admin`)

| Route | Access | Description |
| --- | --- | --- |
| `/admin` | `ADMIN` only | Executive dashboard with metrics, interactive charts, and confirmed orders queue. |
| `/admin/orders` | `ADMIN` only | Order fulfillment center with status filter tabs, search, and 1-click processing. |
| `/admin/products` | `ADMIN` only | Catalog management table with search, category filtering, and stock overview. |
| `/admin/products/new` | `ADMIN` only | Product creation form with multi-image Cloudinary upload and variant editor. |
| `/admin/categories` | `ADMIN` only | Category hierarchy builder and slug generator. |
| `/admin/coupons` | `ADMIN` only | Promotional coupon creator and usage statistics. |
| `/admin/reviews` | `ADMIN` only | Review moderation queue with approve, reject, and delete capabilities. |
| `/admin/users` | `ADMIN` only | Customer directory and role assignment tool. |

### Key API Endpoints & Route Handlers

- `GET /api/search` — Autocomplete search suggestions for the storefront search bar.
- `GET, POST, PATCH, DELETE /api/cart` — Authenticated cart management and reconciliation.
- `POST /api/cart/sync` — Synchronizes guest cart items with user database cart.
- `POST /api/orders` — Idempotent order creation endpoint with request hash verification.
- `GET /api/wishlist/count` — Lightweight count query for live navbar wishlist indicator.
- `GET, PATCH /api/notifications` — Notification reader and mark-as-read updater.
- `POST /api/payments/payhere/notify` — PayHere IPN webhook receiver with MD5 signature validation.

---

## Project Structure

```text
velora/
├── .github/workflows/ci.yml       # GitHub Actions CI pipeline
├── Dockerfile                     # Multi-stage production container
├── prisma/
│   ├── schema.prisma              # Relational database schema
│   ├── migrations/                # Versioned SQL migration files
│   └── seed.ts                    # Local development demo seed script
├── public/
│   ├── fonts/                     # Bundled Inter variable font
│   └── *.png                      # Storefront assets
├── src/
│   ├── app/
│   │   ├── (auth)/                # Register, Verify, Login, Forgot & Reset Password
│   │   ├── (shop)/                # Shop catalog, product details, cart, checkout
│   │   ├── account/               # Customer account profile, addresses, orders, reviews
│   │   ├── admin/                 # Admin dashboard, products, orders, reviews, coupons
│   │   └── api/                   # Route handlers (cart, orders, notifications, payments)
│   ├── components/
│   │   ├── admin/                 # Review actions, quick buttons, processing queues
│   │   │   └── charts/            # Handcrafted SVG charts (Sales, Donut, Category, Rating)
│   │   ├── checkout/              # Address form, coupon form, order summary
│   │   ├── layout/                # Navbar, Footer, NotificationBell, UserMenu
│   │   └── shop/                  # Product cards, filters, gallery, wishlist buttons
│   ├── lib/
│   │   ├── auth/                  # requireUser and requireAdmin permission guards
│   │   ├── db/                    # Prisma client instance with adapter
│   │   ├── validation/            # Zod validation schemas
│   │   ├── payhere.ts             # Signature generation and verification
│   │   ├── email.ts               # Nodemailer SMTP email service
│   │   ├── redis.ts               # Redis cache & sliding-window rate limiter
│   │   └── sri-lankan-districts.ts# 25 administrative districts constant
│   ├── store/                     # Zustand persistent cart store
│   └── types/                     # Shared TypeScript interfaces
├── vitest.config.ts               # Unit test runner configuration
└── next.config.ts                 # Next.js configuration (images, output standalone)
```

---

## Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x`
- **PostgreSQL**: `v15` or `v16`
- **Redis**: Optional for local development (application fails open gracefully if Redis is absent)

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/HasarangaSam/velora.git
cd velora
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory:
```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velora?schema=public"
AUTH_SECRET="development-auth-secret-min-32-chars-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379"

# Optional Services (Defaults provided in code for local development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="velora@example.com"

# Cloudinary (Required for image uploads in admin)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# PayHere Sandbox
PAYHERE_SANDBOX="true"
PAYHERE_MERCHANT_ID="your-merchant-id"
PAYHERE_MERCHANT_SECRET="your-merchant-secret"
PAYHERE_NOTIFY_URL="http://localhost:3000/api/payments/payhere/notify"
```

### Step 3: Database Migrations & Seeding
```bash
# Apply migrations to database
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed sample categories, products, and admin user
npm run seed
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront, or [http://localhost:3000/admin](http://localhost:3000/admin) to access the admin workspace.

---

## Environment Configuration

| Variable | Scope | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server | PostgreSQL connection string with schema parameter. |
| `AUTH_SECRET` | Server | Cryptographic key used by NextAuth to sign JWT sessions. |
| `NEXT_PUBLIC_APP_URL` | Both | Publicly accessible origin URL used for absolute links and payment callbacks. |
| `REDIS_URL` | Server | Redis connection string for catalog caching and sliding rate limits. |
| `CLOUDINARY_*` | Server | Cloudinary API credentials for uploading and hosting product photos. |
| `PAYHERE_*` | Server | PayHere merchant ID, merchant secret, sandbox flag, and notify URL. |
| `SMTP_*` | Server | SMTP host, port, user, and password for verification codes and receipts. |

---

## Testing & Quality Assurance

Velora includes unit testing for input validation and business logic schemas using **Vitest**:

```bash
# Run unit tests once
npm test

# Run linter
npm run lint

# Run TypeScript type check
npx tsc --noEmit
```

Continuous integration runs via GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) testing linting, unit tests, and production build generation on every push and pull request.

---

## Docker & Production Deployment

### Multi-Stage Docker Build
The included [`Dockerfile`](Dockerfile) creates an optimized, secure production image utilizing Next.js standalone output:

```bash
# Build Docker image
docker build -t velora:latest .

# Run container with production environment variables
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/veloradb?schema=public" \
  -e AUTH_SECRET="production-random-secret" \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  velora:latest
```

### Vercel Deployment
1. Connect repository to Vercel.
2. In Project Settings, configure `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL`.
3. Set Function Region to match your PostgreSQL database host location to minimize database query latency.
4. Deploy migrations with `npx prisma migrate deploy` prior to launching production traffic.

---

## Security & Operational Architecture

- **Fail-Open Redis Resilience**: If Redis experiences an outage, catalog queries and rate limiters fail open. The storefront remains fully available to customers while falling back to database reads.
- **SQL Injection Immunity**: All database queries are executed via Prisma ORM using parameterized SQL statements.
- **XSS Sanitization & Zod Enforcement**: All user inputs (names, reviews, comments, addresses) pass through strict Zod schemas before persistence.
- **CSRF & Callback Signatures**: Auth.js CSRF tokens protect mutations. PayHere webhooks require valid cryptographic MD5 signatures.
- **Session Revocation**: `sessionVersion` allows immediate invalidation of compromised credentials across all devices.

---

## License

This project is open-source. Inter font files are licensed under the [SIL Open Font License 1.1](public/fonts/OFL.txt).
