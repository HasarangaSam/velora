# Velora

**A full-stack fashion commerce application built with Next.js, TypeScript, PostgreSQL, and Prisma.** Velora brings together a product storefront, customer accounts, inventory-aware carts, checkout and payment handling, and an admin workspace in one application.

The project is designed to demonstrate end-to-end product engineering: relational data modelling, server-rendered pages, API and Server Action boundaries, authentication and role checks, validation, payment notifications, automated checks, and containerized deployment.

## What the application does

### Shopping experience

- The homepage includes an automatically rotating three-image hero using `public/1.png`, `public/2.png`, and `public/3.png`, plus a welcome coupon offer and collection/product highlights. The Men, Women, and Kids collection cards use database images from their matching subcategories (`men-shirts`, `women-dresses`/Frocks, and `kids-t-shirts`); the occasion feature uses an image from `women-sarees`. Each section prefers the product's primary image and falls back to its first gallery image.
- The homepage's featured-products section shows active products marked **Featured** in the admin product form and uses their primary database images.
- A fixed WhatsApp contact button opens a chat with the configured Velora support number. Footer Facebook, Instagram, and TikTok buttons are disabled placeholders until official profile links are available.
- Browse active products by category and subcategory, search by product name or description, filter by price, and sort by name, newest, or price.
- View product galleries, available sizes and colours, per-variant prices and stock, ratings, and approved reviews. Reviews can be submitted by customers with a paid order for the product and require admin approval before public display.
- Add products to a browser-persisted guest cart. After sign-in, the cart can be synchronized with the user's database cart; signed-in cart operations check current product availability and inventory.
- Check out from the cart or use **Buy now** for one selected variant.
- Save delivery addresses, apply eligible coupons, review shipping and discount totals, and continue to PayHere checkout.
- View order history and order details. The PayHere notification flow updates payment and order state and sends a receipt email after successful payment.
- Save products to a personal wishlist and receive account notifications about order activity.

### Accounts

- Register with an email and password, then verify the email with a time-limited one-time code.
- Sign in with verified credentials or optionally connect Google OAuth.
- Request a password reset by email and invalidate existing sessions when a password is changed.
- Manage profile details, delivery addresses, orders, reviews, and wishlist items.

### Admin workspace

The `/admin` area is restricted to users with the `ADMIN` role. It includes a dashboard and workflows to:

- Create, edit, activate, feature, and delete products and their size/colour variants.
- Search products by name, filter the list by main category and active status, and browse results 10 products per page.
- Search user accounts by name or email, filter by customer or administrator role, and browse 10 accounts per page.
- Search orders by order number or customer name/email, filter by order status, and browse 10 orders per page.
- Organize products with parent categories and subcategories.
- Upload, reorder, set the primary image for, and remove product images using Cloudinary. New products require at least one image, and an existing product must retain at least one image. Saving an edit returns to the product list.
- Review and moderate product reviews.
- Manage orders and order status, coupons, customer accounts, and user roles.
- Receive in-app notifications about new orders and submitted reviews.

## Application routes

| Area | Routes |
| --- | --- |
| Storefront | `/`, `/shop`, `/shop/products/[slug]`; `/products/[slug]` is also available as a product-detail route. |
| Cart and checkout | `/cart`, `/checkout`, `/checkout/payment`, `/checkout/success`, `/checkout/cancelled` |
| Authentication | `/register`, `/verify-email`, `/login`, `/forgot-password`, `/reset-password` |
| Customer account | `/account`, `/account/profile`, `/account/addresses`, `/account/orders`, `/account/orders/[id]`, `/account/reviews`, `/account/wishlist` |
| Administration | `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/coupons`, `/admin/users`, `/admin/reviews` and their detail/create pages |

### API surface

| Endpoint | Methods | Responsibility |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | `GET`, `POST` | Auth.js handlers. |
| `/api/search` | `GET` | Product suggestions for the storefront search input. |
| `/api/cart`, `/api/cart/[itemId]`, `/api/cart/sync` | `GET`, `POST`, `PATCH`, `DELETE` | Authenticated cart reads and changes, guest-cart reconciliation, and Buy now quote data. |
| `/api/addresses`, `/api/addresses/[id]` | `GET`, `POST`, `PATCH`, `DELETE` | Authenticated delivery-address management. |
| `/api/orders` | `GET`, `POST` | Create an idempotent checkout order and read the signed-in user's order history. |
| `/api/orders/[id]` | `GET` | Read an order detail belonging to the signed-in user. |
| `/api/notifications` | `GET`, `PATCH` | Read notifications and mark one or all as read. |
| `/api/admin/products/*`, `/api/admin/categories/*` | `GET`, `POST`, `PATCH`, `DELETE` | Admin-only catalog and category APIs, including variants and image management. |
| `/api/payments/payhere/notify` | `POST` | Validate and process PayHere server notifications. |

## Engineering highlights

- **Server and client composition:** Next.js App Router Server Components handle data-oriented pages; Client Components provide interactive forms, cart state, search suggestions, galleries, and admin controls.
- **Clear mutation boundaries:** Server Actions handle form-oriented mutations and revalidation. Route Handlers expose cart, address, order, search, admin, notification, authentication, and payment-notification APIs.
- **Runtime validation:** Zod schemas validate cart, checkout, catalog, address, product, category, and variant inputs. Validation failures are handled before data reaches persistence logic.
- **Relational domain model:** PostgreSQL and Prisma model accounts, hierarchical categories, products, images, variants, carts, addresses, orders, payments, coupons, reviews, wishlists, verification records, and notifications.
- **Checkout correctness:** Prices and totals are calculated on the server. Order creation uses an idempotency key and request fingerprint to make retries safe. Orders retain shipping and line-item snapshots so later catalog or address edits do not rewrite historical order details.
- **Payment verification:** The PayHere notification handler verifies the provider signature and checks the merchant, order, currency, and amount before applying payment changes. Payment confirmation, coupon usage, and inventory updates use database transactions with serializable isolation and conflict handling.
- **Authorization and account safety:** Shared `requireUser` and `requireAdmin` helpers protect user and admin operations. Passwords are hashed with bcrypt; verification codes and reset requests are time-limited; password changes increment a session version so older sessions are rejected.
- **Cache and throttling:** Redis backs catalog and homepage featured-product caching, plus rate-limit counters. Product and image changes invalidate the homepage product cache. Cache reads and rate-limit checks are designed to fail open when Redis is unavailable, keeping the storefront available while reducing the protection those features can provide during an outage.
- **Build and delivery:** The build command generates the Prisma client before compiling Next.js. Next.js standalone output is used by a multi-stage Docker image. GitHub Actions runs lint, unit tests, and a production build on pushes and pull requests.

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS 4, Lucide React, locally bundled Inter variable font |
| Validation | Zod 4 |
| Authentication | Auth.js / NextAuth, Prisma adapter, credentials, optional Google OAuth |
| Database | PostgreSQL, Prisma ORM 7, PostgreSQL driver adapter |
| Client cart | Zustand with browser `localStorage` persistence |
| Cache and rate limiting | Redis with ioredis |
| Product images | Cloudinary |
| Email | Nodemailer over SMTP |
| Payments | PayHere, including sandbox configuration |
| Unit testing | Vitest |
| Code quality and delivery | ESLint 9, GitHub Actions, Docker, Next.js standalone output |

## Architecture

```mermaid
flowchart LR
  Browser[Browser\nNext.js pages and client UI] --> App[Next.js App Router\nServer Components, Server Actions, Route Handlers]
  App --> Validation[Zod validation]
  Validation --> Domain[Application services\ncatalog, cart, checkout, orders]
  Domain --> Prisma[Prisma Client]
  Prisma --> PostgreSQL[(PostgreSQL)]
  Domain --> Redis[(Redis\ncache and rate limits)]
  App --> Auth[Auth.js\nJWT sessions and role checks]
  App --> Cloudinary[Cloudinary\nproduct images]
  App --> SMTP[SMTP\nverification, reset, receipts]
  App --> PayHere[PayHere\nhosted payment and notify callback]
```

### Important request flows

**Cart and checkout:** Guest items live in Zustand/localStorage. When a user signs in, `CartSync` posts those items to the server, which checks active products and available variants before reconciling with the database cart. At checkout, the server recalculates prices, stock, shipping, and coupon eligibility; the browser never supplies authoritative totals.

**Order idempotency:** The checkout client reuses a persisted idempotency key for the same request. The orders endpoint hashes the normalized request and associates it with the key, preventing duplicate orders from ordinary retries and rejecting reuse of a key for a different checkout payload.

**Payment confirmation:** The customer is sent to PayHere's hosted checkout. The server-side notification endpoint verifies the callback signature and order details, then applies payment, inventory, coupon, and order-state changes transactionally. The browser return page is not treated as payment proof.

**Catalog reads:** Catalog query parameters are schema-validated. Product listings are paginated in groups of 12 and cached in Redis for 60 seconds; if Redis is unavailable, the application falls back to database reads.

## Data model

The Prisma schema is the source of truth for the relational model. Its main entities are:

| Domain | Models | Notes |
| --- | --- | --- |
| Identity | `User`, `Account`, `VerificationCode`, `PasswordResetToken` | Credentials and OAuth accounts, email verification, and password reset records. |
| Catalog | `Category`, `Product`, `ProductImage`, `ProductVariant` | Categories can have parent/child relationships. Price and stock belong to variants. Images retain Cloudinary public IDs and gallery ordering. |
| Shopping | `Cart`, `CartItem`, `WishlistItem`, `Address` | One persistent cart per user; uniqueness constraints prevent duplicate variants in a cart and duplicate wishlist entries. |
| Orders and payments | `Order`, `OrderItem`, `Payment`, `Coupon`, `CouponUsage` | Orders snapshot delivery and item details; database uniqueness constraints support payment and checkout idempotency. |
| Engagement | `ProductReview`, `Notification` | Reviews have moderation status and verified-purchase metadata; notifications belong to a recipient. |

Database changes are tracked under [`prisma/migrations`](prisma/migrations). Notable migrations add hierarchical categories, wishlists, moderated product reviews, notifications, welcome-coupon rules, shipping snapshots/payment constraints, and checkout idempotency.

## Project layout

```text
.
├── .github/workflows/ci.yml       # GitHub Actions quality workflow
├── Dockerfile                     # Multi-stage production image
├── public/fonts/                  # Bundled Inter font and SIL OFL license
├── prisma/
│   ├── schema.prisma              # Data model and generated-client output
│   ├── migrations/                # Versioned PostgreSQL migrations
│   └── seed.ts                    # Local demo data
├── src/
│   ├── app/
│   │   ├── (auth)/                # Registration, verification, login, reset
│   │   ├── (shop)/                # Storefront, product, cart, checkout pages
│   │   ├── account/               # Profile, addresses, orders, reviews, wishlist
│   │   ├── admin/                 # Admin pages and Server Actions
│   │   └── api/                   # Route Handlers and provider callbacks
│   ├── components/                # Account, admin, auth, checkout, layout, shop UI
│   ├── lib/                       # Database, auth, catalog, cart, payment, email,
│   │                              # cache, validation, and domain helpers
│   ├── store/                     # Zustand cart store
│   └── types/                     # Shared application types
├── vitest.config.ts               # Vitest configuration
└── next.config.ts                 # Next.js standalone output and image hosts
```

## Run locally

### Prerequisites

- Node.js 22 and npm
- PostgreSQL
- Optional: Redis, SMTP credentials, Cloudinary credentials, PayHere credentials, and Google OAuth credentials, depending on which integrations you want to exercise

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root. It is ignored by Git. A minimal local configuration is:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velora?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379"
```

See [Configuration](#configuration) for the optional provider settings. The database must already exist and be reachable. Redis is optional for local browsing; the application uses the URL above by default and handles Redis failures by falling back for catalog reads and rate limits.

### 3. Apply migrations and optionally seed demo data

```bash
npx prisma migrate deploy
npx prisma generate
npm run seed
```

The seed script first clears existing records, then inserts sample categories, products, a customer address, users, and coupons. It refuses to run unless `DATABASE_URL` points to a localhost database named `velora`; running it replaces the contents of that local database. It contains hard-coded development passwords and seeded users are not automatically email-verified, so use the normal registration and verification flow when demonstrating sign-in. Do not use seed credentials or seed data in a shared or production environment.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | App and Prisma | PostgreSQL connection string. Required for database access, migrations, seeding, and Prisma client generation. |
| `AUTH_SECRET` | Authentication | Long, random secret used by Auth.js. Keep it out of source control. |
| `NEXT_PUBLIC_APP_URL` | Absolute app links and PayHere return URLs | For local development, use `http://localhost:3000`. Set the public origin in deployed environments. |
| `NEXTAUTH_URL` | Password-reset link fallback | The reset flow uses `NEXT_PUBLIC_APP_URL` first, then `NEXTAUTH_URL`, then localhost. |
| `REDIS_URL` | Redis features | Defaults to `redis://localhost:6379`. Cache and rate-limit behavior falls back when Redis is unreachable. |
| `SMTP_HOST` | Verification, reset, and receipt email | Defaults to `smtp.gmail.com`. |
| `SMTP_PORT` | SMTP | Defaults to `465`; port 465 enables TLS. |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP authentication | The code also accepts legacy `AUTH_EMAIL_USER` and `AUTH_EMAIL_PASSWORD`. |
| `SMTP_FROM` | Email sender display address | Optional; otherwise a default Velora sender is used. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth | Optional; configure both with a Google OAuth application. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Admin image management | Required to upload or manage hosted product images. |
| `PAYHERE_SANDBOX` | PayHere environment | Set to `true` to use the sandbox checkout URL; otherwise the live URL is selected. |
| `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET` | PayHere checkout and callback verification | Use credentials from the matching PayHere environment. |
| `PAYHERE_NOTIFY_URL` | PayHere notifications | Publicly reachable callback URL for `/api/payments/payhere/notify`. |

Provider-backed flows need working credentials and callback URLs. The storefront and local code-quality workflow can be explored without configuring every optional provider, but email, OAuth, Cloudinary uploads, and real payment processing cannot be fully exercised without them.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run lint` | Run ESLint across the project. |
| `npm test` | Run the Vitest suite once. |
| `npm run build` | Generate the Prisma client, then create the optimized Next.js production build. |
| `npm run start` | Serve a previously built production app. |
| `npx prisma migrate deploy` | Apply committed migrations to the configured database. |
| `npm run seed` | Reset the localhost `velora` database and insert demo records. |

## Tests

Vitest currently covers the cart-validation schemas in `src/lib/validation/cart.test.ts`. The tests demonstrate valid input parsing, numeric-string coercion, invalid quantities, missing variant IDs, and the maximum synchronized-cart size. The suite uses the Node environment and does not need a database, browser, or external service.

Run it with:

```bash
npm test
```

The current repository does not include browser end-to-end tests or a full integration-test suite for PostgreSQL, PayHere, SMTP, Redis, or Cloudinary.

## Continuous integration

GitHub Actions is configured in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). It runs on pushes and pull requests and performs these checks on Node.js 22:

1. Install npm dependencies.
2. Run ESLint.
3. Run the Vitest unit tests.
4. Build the production app with placeholder database and Auth.js environment values.

The workflow does not deploy the application or start PostgreSQL, Redis, SMTP, or payment-provider services. Provider integrations and database-backed runtime behavior therefore need separate environment-level verification.

## Docker

The `Dockerfile` has dependency, builder, and runtime stages. The runtime stage uses Next.js standalone output and starts the generated `server.js`. The build stage uses placeholder environment values to build without embedding real credentials. Runtime secrets and service URLs must be supplied to the running container.

## Deploy to Vercel

The repository includes [`vercel.json`](vercel.json) to identify the project as a Next.js application. Vercel detects the framework and uses the `build` script in `package.json`, which generates Prisma Client before running `next build`. The Next.js configuration uses Vercel's platform output on Vercel and keeps standalone output for the Docker image.

1. Import this Git repository into Vercel and keep the project root as the Root Directory.
2. Add the environment variables required by the features you plan to use. At minimum, configure `DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL` for Production. Set the same variables for Preview only if previews should connect to a database; use an isolated preview database where possible.
3. Before the first deployment, apply the committed Prisma migrations to the production database with `npx prisma migrate deploy` from a trusted environment using the production `DATABASE_URL`. Repeat this when deploying schema changes. The Vercel build does not automatically run migrations or seed data.
4. Deploy. In Vercel project settings, choose a Function Region close to the PostgreSQL database to reduce database request latency.
5. If using PayHere, set `PAYHERE_NOTIFY_URL` to the deployed origin plus `/api/payments/payhere/notify`, and configure the same public origin in `NEXT_PUBLIC_APP_URL`.

Redis, SMTP, Google OAuth, Cloudinary, and PayHere credentials are optional for deployments that do not use those features. Redis is not provisioned by Vercel for this app; configure a managed Redis endpoint with `REDIS_URL` if you want shared caching and rate-limit counters across serverless instances. When Redis is unavailable, those features fall back as described above.

Vercel's Next.js framework detection and build defaults are documented in its [build configuration](https://vercel.com/docs/builds/configure-a-build). Function regions can be selected in [project settings](https://vercel.com/docs/functions/configuring-functions/region); keep the app close to its database when choosing one.

Build the image:

```bash
docker build -t velora .
```

Run it with a reachable PostgreSQL database and a real runtime secret:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/velora?schema=public" \
  -e AUTH_SECRET="your-long-random-secret" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  velora
```

Apply migrations to the target database before using the app. The container does not run migrations automatically and does not bundle PostgreSQL, Redis, or provider services. When the database runs on the host machine, use a hostname reachable from the container (for example, `host.docker.internal` where supported) instead of `localhost` in `DATABASE_URL`.

## Security and operational notes

- Never commit `.env` files, API credentials, database passwords, or production secrets.
- The demo seed includes hard-coded low-strength passwords. Keep seed data confined to a disposable local database; do not use those accounts in a shared environment.
- Registration, OTP verification/resend, password reset, and order creation use Redis-backed rate limits. The current limiter intentionally fails open when Redis is unavailable, so production deployments should monitor Redis and consider whether that availability trade-off matches their threat model.
- Configure HTTPS, production-grade secrets, SMTP, PayHere callbacks, and image-storage credentials before exposing a deployment.
- The Docker image contains the application only. Database provisioning, migrations, backups, Redis availability, and provider setup belong to the deployment environment.

## License and font attribution

Inter is bundled locally from the [Google Fonts Inter family](https://github.com/google/fonts/tree/main/ofl/inter) so builds do not need to fetch the font from Google. The font is distributed under the [SIL Open Font License 1.1](public/fonts/OFL.txt); the license file is included with the font.
