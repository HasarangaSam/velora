# Velora

Velora is a full-stack fashion commerce application for a Sri Lankan storefront. It covers the customer journey from product discovery through payment and order tracking, alongside operational tools for catalog, customer, order, coupon, and review management.

This is a portfolio project built to demonstrate application architecture and commerce workflows. Payment, email, image, OAuth, database, and cache integrations need credentials and services of your own before they can operate outside local development.

## At a glance

- **Storefront:** product and category discovery, search suggestions, server-rendered filters, product images, size/colour stock variants, sale pricing, wishlists, and moderated reviews.
- **Commerce:** browser-persisted guest cart, authenticated cart synchronization, buy-now checkout, address selection, coupon rules, LKR totals, and PayHere checkout.
- **Order integrity:** server-side price and stock checks, immutable purchase and delivery snapshots, idempotent order creation, and transactional payment confirmation, inventory deduction, and coupon usage.
- **Identity:** credentials and optional Google sign-in, verified-email requirement for password accounts, password reset links, role-aware sessions, profile and address management.
- **Operations:** admin dashboard and analytics, order fulfillment queue, product and variant management, customer profiles and order history, coupon configuration, and review moderation.
- **Delivery:** Next.js standalone Docker image, GitHub Actions quality checks, versioned Prisma migrations, and a local demo seed.

## Architecture

| Layer          | Implementation                                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application    | Next.js 16 App Router, React 19, TypeScript 5; server components for data-driven pages, client components for interactive UI, route handlers and server actions for mutations |
| Persistence    | PostgreSQL with Prisma ORM 7 and the `@prisma/adapter-pg` driver adapter                                                                                                      |
| Authentication | Auth.js / NextAuth v5 with JWT sessions, Prisma adapter, credentials and optional Google provider                                                                             |
| Validation     | Zod schemas shared at request boundaries; server-side authorization for user and admin operations                                                                             |
| Client state   | Zustand cart and wishlist state persisted in the browser, with cart synchronization for signed-in customers and optimistic wishlist toggles before server reconciliation      |
| Integrations   | PayHere, Cloudinary, Nodemailer over SMTP, and Redis for cache and security rate limits                                                                                       |
| UI             | Tailwind CSS 4 and Lucide React                                                                                                                                               |
| Quality        | ESLint, TypeScript checks, Vitest, GitHub Actions, Docker                                                                                                                     |

### Request and data flow

```text
Browser
  ├── App Router pages / server actions
  └── Route handlers (/api/*)
          ├── Auth.js session + role checks
          ├── Zod request validation
          ├── Domain helpers (pricing, checkout, reviews, notifications)
          ├── Prisma Client → PostgreSQL
          └── External services (PayHere, SMTP, Cloudinary, optional Redis)
```

Business rules are kept on the server. Client-side totals and form validation support the user experience, but they are not trusted when creating orders, applying coupons, updating inventory, or processing payment notifications.

## Commerce rules and invariants

### Product pricing and inventory

- A product owns its regular `price` and optional `salePrice`; all of its size/colour variants share that price. Variants represent stock-keeping options and maintain independent inventory counts.
- The effective price is the sale price only when it is finite, positive, and lower than the regular price. Otherwise the regular price applies. The same rule drives display and server-side checkout totals.
- Variant uniqueness is enforced per product across `(productId, size, colour)`. The catalog validates option sets before creation and the database constraint remains the final guard against duplicates.
- Product availability and requested quantity are checked against current product and variant data during order creation. Inventory is deducted only after PayHere confirms payment.

### Checkout totals and coupons

The server recomputes checkout totals from database records rather than accepting client-provided product prices:

1. Read current product prices and selected variant stock for either the signed-in cart or a buy-now item.
2. Calculate the subtotal from effective product prices and quantities.
3. Validate an optional coupon's active window, minimum spend, global usage limit, per-customer limit, and discount cap. Percentage and fixed discounts are supported; discounts cannot exceed the subtotal.
4. Calculate delivery at **LKR 400**, waived when the post-coupon subtotal is at least **LKR 10,000**.
5. Persist the subtotal, discount, shipping, and final total on the order. These are the values used for payment validation and later order history.

`WELCOME500` is restricted to a customer's first successfully paid order. Coupon validation in the UI is advisory; the order and payment paths recheck eligibility to handle stale or concurrent requests.

### Order creation and payment lifecycle

- Order creation requires an authenticated customer, a valid address belonging to that customer, valid request data, and an `Idempotency-Key`.
- The key is stored with a SHA-256 hash of the checkout intent. Replaying the same key and intent returns the existing order; reusing it for a different customer or checkout intent returns a conflict. A unique database constraint handles simultaneous retries.
- Order creation persists a pending order, pending payment, item snapshots, and delivery address snapshot in a database transaction. The cart is cleared as part of that transaction for cart checkout.
- Order items retain the product name, selected size and colour, unit price, and quantity at purchase time. Shipping fields are copied to the order, so later catalog or saved-address edits do not rewrite the historical receipt.
- PayHere sends the browser back to success/cancel pages, but the return URL alone does not mark an order paid. The server notification endpoint checks the configured merchant, PayHere signature, LKR currency, order number, and amount against the persisted order.
- For a successful notification, a serializable transaction rechecks the pending state, decrements each variant's stock conditionally, enforces coupon eligibility and usage limits, records coupon usage, and changes payment/order status. Serialization conflicts are retried up to three times. Repeated success notifications do not repeat these effects.
- Order confirmation email is sent after a newly confirmed payment. Notification and email delivery are external side effects and are not part of the database transaction.

### Accounts and reviews

- Password registrations normalize email addresses and hash passwords with bcrypt. Passwords must contain at least 8 characters, an uppercase letter, and a symbol; password accounts cannot sign in until email verification is complete.
- Credentials and Google OAuth are supported. JWT sessions carry the user role and session version; the current user record is checked in the JWT callback, and a changed session version invalidates older sessions.
- Credential login failures are throttled at 20 per normalized email and 60 per trusted client IP per 15-minute window when a trusted IP is configured. Identifiers are HMAC-hashed before they are used as Redis keys; sign-in is denied in production if Redis is unavailable.
- Registration verification codes are HMAC-digested at rest, expire after 15 minutes, allow at most five incorrect attempts, and are consumed once when used. Resend and password-reset requests have per-email throttles and trusted-IP throttles where available.
- Password-reset links use 256-bit random tokens. Only an HMAC digest is stored, and token consumption and password/session-version updates happen in one transaction. Email delivery failures never log recovery secrets in production; the local development fallback can print them to the developer console.
- User and administrator operations use server-side identity/role guards. Customers can manage their profile, saved addresses, orders, wishlist, and reviews.
- A customer can review a product only after a paid, non-cancelled purchase. Reviews are unique per customer/product and require moderation before appearing in the public product review list.

### Operational behavior

- The admin dashboard summarizes paid revenue, orders, active products, low-stock variants, registered customers, order status, category sales, and review ratings. Dashboard summary metrics use a short Redis cache when available.
- Notifications are persisted per recipient. The browser refreshes them on navigation/focus and on a 45-second interval.
- Redis is optional for catalog caching and local development. In production, credential sign-in and sensitive account flows fail closed if Redis is unavailable; configure Redis for those flows. Other best-effort cache/rate-limit paths may fail open.
- Login and account-operation throttles hash account identifiers before using them as Redis keys. Vercel's overwritten client-IP header is used on Vercel; self-hosted deployments should set `TRUSTED_CLIENT_IP_HEADER` to a header their reverse proxy overwrites, and should not pass caller-supplied forwarding headers through unchanged.
- Price inputs on the storefront filter are debounced so the listing does not issue a new navigation for every key press.
- Route-level loading, error, and not-found boundaries provide fallbacks for storefront, account, admin, and root routes.

## Product surface

### Main pages

| Route                                      | Purpose                                                           |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `/`                                        | Storefront home and featured collections                          |
| `/shop`                                    | Searchable, filterable, sortable, paginated catalog               |
| `/products/[slug]`                         | Product detail, variants, stock, reviews, and purchase actions    |
| `/cart`                                    | Guest or signed-in cart                                           |
| `/checkout`                                | Address selection, coupon, and order review                       |
| `/checkout/payment`                        | PayHere payment handoff                                           |
| `/checkout/success`, `/checkout/cancelled` | Payment return screens; server callback remains payment authority |
| `/login`, `/register`, `/verify-email`     | Authentication and email verification                             |
| `/forgot-password`, `/reset-password`      | Password recovery by reset link                                   |
| `/account/*`                               | Profile, addresses, orders, wishlist, and reviews                 |
| `/admin/*`                                 | Admin dashboard and management workflows                          |

### API surface

Route handlers are under `src/app/api`:

- `/api/search` — product suggestions.
- `/api/cart`, `/api/cart/[itemId]`, `/api/cart/sync` — cart reads, mutations, and guest-cart synchronization.
- `/api/orders`, `/api/orders/[id]` — idempotent order creation and customer-scoped order access.
- `/api/addresses`, `/api/addresses/[id]` — customer address operations.
- `/api/coupons/validate` — coupon preview; checkout applies authoritative validation again.
- `/api/payments/payhere/notify` — verified PayHere server callback.
- `/api/notifications`, `/api/wishlist/count` — account notification and wishlist data.
- `/api/admin/*` — guarded product, variant, image, and category operations.
- `/api/auth/[...nextauth]` — Auth.js handlers.

## Data model

The schema is in `prisma/schema.prisma`; migrations are in `prisma/migrations`.

| Domain     | Models                                                      | Design notes                                                                                       |
| ---------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Identity   | `User`, `Account`, `VerificationCode`, `PasswordResetToken` | Unique email, role, email verification, OAuth account linkage, session version                     |
| Catalog    | `Category`, `Product`, `ProductImage`, `ProductVariant`     | Hierarchical categories, product-level regular/sale pricing, ordered images, per-size/colour stock |
| Shopping   | `Cart`, `CartItem`, `WishlistItem`, `Address`               | One cart per user, unique variant per cart, one wishlist entry per product/customer                |
| Checkout   | `Order`, `OrderItem`, `Payment`                             | Persisted monetary totals and item/shipping snapshots; one payment record per order                |
| Promotions | `Coupon`, `CouponUsage`                                     | Fixed or percentage discounts, date windows, global/per-user limits, one usage record per order    |
| Engagement | `ProductReview`, `Notification`                             | Review moderation and recipient-scoped notifications                                               |

Important database constraints include unique user email, product slug, product option tuple, cart/variant tuple, user/product wishlist and review tuples, order number, checkout request key, payment order, and coupon order usage. Foreign-key delete behavior is chosen to preserve order history while cleaning up dependent shopping data.

Use versioned migrations to evolve a shared or deployed database. Do not use `prisma db push` as a production schema deployment mechanism.

## Getting started

### Requirements

- Node.js 22 and npm
- PostgreSQL
- Redis for production credential sign-in and sensitive authentication throttles; optional for local development and caching
- SMTP, Cloudinary, PayHere sandbox, and Google OAuth credentials depending on which integrations you want to exercise

### Local setup

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/HasarangaSam/velora.git
   cd velora
   ```

2. Create a PostgreSQL database and copy `.env.example` to `.env`. Set the required local values and configure the optional integrations you plan to use:

   ```bash
   cp .env.example .env
   ```

   On PowerShell, use `Copy-Item .env.example .env`.

   `.env*` files are ignored by Git. Keep credentials private. PayHere's notification URL must be reachable by PayHere; a local `localhost` URL cannot receive provider callbacks.

3. Install dependencies:

   ```bash
   npm ci
   ```

4. Apply migrations and generate the Prisma client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

   Generated client output lives in `generated/prisma` and is not committed.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

### Demo data

`npm run seed` resets and repopulates the local `velora` database with demo users, categories, products, variants, and related records. The seed script explicitly refuses to run unless the database host is loopback and the database name is `velora`. It deletes existing data in that database, so use it only for disposable local development.

Demo credentials:

| Role     | Email                | Password      |
| -------- | -------------------- | ------------- |
| Admin    | `admin@gmail.com`    | `admin123`    |
| Admin    | `admin@velora.lk`    | `admin123`    |
| Customer | `customer@velora.lk` | `customer123` |

All three seeded accounts are email-verified. These credentials are for local demonstration only. Never use them in a deployed environment.

## Development commands

| Command             | Description                                         |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start Next.js development server                    |
| `npm run build`     | Generate Prisma Client and build the production app |
| `npm run start`     | Serve the production build                          |
| `npm run lint`      | Run ESLint                                          |
| `npm run typecheck` | Generate Prisma Client and run `tsc --noEmit`       |
| `npm test`          | Run Vitest tests once                               |
| `npm run seed`      | Reset and seed the guarded local demo database      |

The current Vitest suite includes focused cart input-schema tests. CI also performs static type checking, linting, tests, a Next.js production build, and a Docker image build.

## CI and container delivery

`.github/workflows/ci.yml` runs on pushes and pull requests with read-only repository-content permissions. It uses Node 22 and the npm lockfile cache, then runs `npm ci`, typecheck, lint, unit tests, production build, and a Docker build. CI builds the image for validation; it does not publish it or deploy the application.

The multi-stage `Dockerfile`:

1. Installs locked dependencies in a Node 22 Alpine dependency stage.
2. Builds Next.js using standalone output and build-only placeholder database/auth values. The placeholders are not production credentials and no database connection is provisioned by the image build.
3. Copies only public assets, standalone server output, and static assets into the runtime stage.
4. Runs `server.js` as the unprivileged `node` account, listening on port 3000.

Build and run locally:

```bash
docker build -t velora:local .

docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@db-host:5432/velora?schema=public" \
  -e AUTH_SECRET="replace-with-a-long-random-secret" \
  -e NEXT_PUBLIC_APP_URL="https://your-domain.example" \
  velora:local
```

For Vercel, configure `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL` in the project environment. Add Google OAuth, SMTP, Cloudinary, Redis, and PayHere values only for integrations you enable; use a public PayHere notification endpoint. Apply `prisma migrate deploy` as a release/deployment step before serving the new app version. This repository does not currently include Docker Compose, a PostgreSQL/Redis container setup, an image registry workflow, or automated deployment. `vercel.json` only identifies the project as Next.js, which Vercel can normally detect automatically. `next.config.ts` enables standalone output for self-hosted/Docker builds and leaves it to Vercel's platform when `VERCEL` is set.

## Repository map

```text
src/
  app/                 App Router pages, layouts, server actions, and API routes
  components/          Storefront, checkout, account, admin, auth, and layout UI
  lib/                 Domain logic, validation, auth guards, integrations, database
  store/               Zustand cart and wishlist state, persistence, and client-side sync helpers
  types/               Shared TypeScript declarations
prisma/
  schema.prisma        PostgreSQL domain model
  migrations/          Versioned database migrations
  seed.ts              Guarded local demo reset and seed
generated/prisma/      Generated Prisma Client output (not committed)
.github/workflows/     CI pipeline
Dockerfile             Multi-stage standalone production image
```

## Engineering notes

- **Money uses PostgreSQL `Decimal` columns.** The current domain helpers convert values to JavaScript numbers for calculations and presentation; order and payment totals are persisted to two-decimal `Decimal` columns. Financial arithmetic at larger scale would benefit from integer minor units or decimal arithmetic end-to-end.
- **Inventory is reserved at payment confirmation, not when the pending order is created.** Checkout validates stock, then the payment callback conditionally decrements stock inside a serializable transaction. This avoids leaving unpaid orders holding inventory, while creating a possible payment-success/stock-race case that is surfaced as a conflict for operations to resolve.
- **Redis improves performance and enforces security throttles.** Authentication-sensitive throttles fail closed in production when Redis is unavailable; the app allows that fallback only in local development. Other best-effort cache/rate-limit paths may fail open.
- **Email and notification delivery are best-effort side effects.** The payment and order database transaction remains authoritative; an email provider outage does not roll back a confirmed payment.
- **The project demonstrates the commerce lifecycle but is not a production claim.** Before a real launch, review operational monitoring, payment reconciliation/refunds, inventory reservation policy, backup/restore, proxy trust configuration, and deployment secret management for the chosen provider.

## License

No license file is currently included. Contact the repository owner before redistributing or reusing the project.
