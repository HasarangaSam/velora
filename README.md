# Velora

Velora is a full-stack fashion storefront built with Next.js, TypeScript, PostgreSQL, and Prisma. It includes customer shopping and account flows, an admin workspace, and integrations for PayHere payments, Cloudinary image uploads, email, and optional Redis caching and rate limits.

This repository is a portfolio project. External services require their own credentials and configuration; the local development setup below does not create those accounts for you.

## Features

- **Storefront:** browse products and categories, search with suggestions, filter by price, sort and paginate results, and view product variants, images, stock, and approved reviews.
- **Cart and checkout:** guest cart state is persisted in the browser and can be synchronized to an account. Checkout recalculates prices and checks stock on the server. It supports saved delivery addresses, coupon validation, a LKR 400 delivery fee, and free delivery when the discounted subtotal is at least LKR 10,000.
- **Orders and payments:** order creation accepts an idempotency key and stores a request hash to detect duplicate or changed retry requests. PayHere payment notifications are checked against the merchant, signature, currency, and order amount before a successful payment is applied.
- **Accounts:** credentials and optional Google sign-in, email verification codes, password reset links, address and profile management, password changes, order history, wishlist, and purchase-eligible reviews.
- **Admin workspace:** dashboard metrics and charts, order processing, product and variant management, category hierarchy, coupon management, customer and role management, and review moderation.
- **Notifications:** customer and admin notifications are stored in PostgreSQL and refreshed in the browser on navigation, focus, and a 45-second interval.
- **Sri Lankan checkout:** LKR currency, Sri Lankan districts, and local delivery address fields.

## Technology

| Area                 | Stack                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Web                  | Next.js 16 App Router, React 19, TypeScript 5                         |
| Database             | PostgreSQL, Prisma ORM 7 with the `@prisma/adapter-pg` driver adapter |
| Authentication       | Auth.js / NextAuth v5, JWT sessions, credentials and Google providers |
| Validation           | Zod                                                                   |
| Client state         | Zustand, browser-persisted guest cart                                 |
| Integrations         | PayHere, Cloudinary, Nodemailer/SMTP, optional Redis via ioredis      |
| Styling              | Tailwind CSS 4, Lucide React                                          |
| Quality and delivery | ESLint, Vitest, GitHub Actions, Docker                                |

## Application map

### Pages

| Path                                       | Purpose                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `/`                                        | Store homepage with featured products and collection links                    |
| `/shop`                                    | Product listing with search, category, price, sorting, and pagination filters |
| `/products/[slug]`                         | Product detail, variants, reviews, and purchase actions                       |
| `/cart`                                    | Shopping cart                                                                 |
| `/checkout`                                | Address selection and order review                                            |
| `/checkout/payment`                        | PayHere checkout handoff                                                      |
| `/checkout/success`, `/checkout/cancelled` | Payment return pages                                                          |
| `/login`, `/register`, `/verify-email`     | Sign in, registration, and email verification                                 |
| `/forgot-password`, `/reset-password`      | Password recovery                                                             |
| `/account` and `/account/*`                | Customer profile, addresses, orders, wishlist, and reviews                    |
| `/admin` and `/admin/*`                    | Admin dashboard and management pages                                          |

### API routes

Key route handlers live under `src/app/api`:

- `/api/search` — product search suggestions.
- `/api/cart`, `/api/cart/[itemId]`, `/api/cart/sync` — authenticated cart operations and guest-cart synchronization.
- `/api/orders`, `/api/orders/[id]` — order creation and customer order retrieval.
- `/api/addresses`, `/api/addresses/[id]` — customer address operations.
- `/api/coupons/validate` — server-side coupon validation.
- `/api/payments/payhere/notify` — PayHere server notification endpoint.
- `/api/notifications`, `/api/wishlist/count` — account notification and wishlist data.
- `/api/admin/*` — admin product, variant, image, and category operations.
- `/api/auth/[...nextauth]` — Auth.js endpoints.

## Requirements

- Node.js 22 and npm
- PostgreSQL
- Redis is optional; the app defaults to `redis://localhost:6379` and cache/rate-limit calls fail open if Redis is unavailable.
- SMTP credentials are needed to deliver registration verification codes, password recovery links, and order emails.
- Cloudinary credentials are needed for admin product image uploads.
- PayHere merchant credentials are needed to complete payment flows. Use sandbox credentials for development.
- Google OAuth credentials are optional and only needed for Google sign-in.

## Local setup

1. Clone the repository:

   ```bash
   git clone https://github.com/HasarangaSam/velora.git
   cd velora
   ```

2. Create a PostgreSQL database named `velora`, then create a `.env` file in the repository root. Example values:

   ```dotenv
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velora?schema=public"
   AUTH_SECRET="replace-with-a-long-random-secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   REDIS_URL="redis://localhost:6379"

   # Optional: Google sign-in
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""

   # Optional: email delivery
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_USER=""
   SMTP_PASSWORD=""
   SMTP_FROM="Velora <noreply@example.com>"

   # Optional: admin product image uploads
   CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""

   # PayHere sandbox settings
   PAYHERE_SANDBOX="true"
   PAYHERE_MERCHANT_ID=""
   PAYHERE_MERCHANT_SECRET=""
   PAYHERE_NOTIFY_URL="https://your-public-host/api/payments/payhere/notify"
   ```

   Keep `.env` private. The repository ignores `.env*` files. PayHere must be configured with a notification URL reachable by the provider; `localhost` is not publicly reachable.

3. Install dependencies. The Prisma CLI may read `DATABASE_URL` during client generation, so create `.env` first:

   ```bash
   npm ci
   ```

4. Apply the checked-in migrations and generate the Prisma client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

   The client is generated under `generated/prisma` and is intentionally not checked into Git.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Optional demo seed

`npm run seed` loads sample accounts, categories, products, variants, and other demo data. **It deletes existing records before seeding.** The script refuses to run unless `DATABASE_URL` points to a local database named `velora`; only use it with disposable local data.

The seed includes demo credentials (`admin@velora.lk` / `admin123` and `customer@velora.lk` / `customer123`). These are for local demonstration only. Never use them outside a disposable development database.

## Commands

| Command             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Start Next.js in development mode                            |
| `npm run build`     | Generate Prisma Client and create a production build         |
| `npm run start`     | Start the built Next.js server                               |
| `npm run lint`      | Run ESLint                                                   |
| `npm run typecheck` | Generate Prisma Client and run `tsc --noEmit`                |
| `npm test`          | Run the Vitest suite                                         |
| `npm run seed`      | Reset and populate a permitted local database with demo data |

## Data model

The Prisma schema in `prisma/schema.prisma` defines the main domain:

- **Users and identity:** `User`, Auth.js `Account`, verification codes, and password reset tokens.
- **Catalog:** hierarchical `Category`, `Product`, `ProductVariant`, and `ProductImage` records.
- **Shopping:** `Cart`, `CartItem`, `WishlistItem`, saved `Address` records, and coupon usage.
- **Orders:** `Order`, `OrderItem` snapshots, and one-to-one `Payment` records.
- **Engagement:** moderated `ProductReview` and recipient-scoped `Notification` records.

Versioned PostgreSQL migrations are in `prisma/migrations`. Use `prisma migrate deploy` to apply them; do not edit a deployed database schema by hand.

## CI and Docker

GitHub Actions runs on pushes and pull requests. The workflow installs with `npm ci`, typechecks, lints, runs Vitest, builds the app, and builds the Docker image. The image is built for validation and is not published by this workflow.

The multi-stage Dockerfile uses Next.js standalone output, copies only the runtime output into the final stage, and runs the app as the unprivileged `node` user. Build the image with:

```bash
docker build -t velora:local .
```

Run it with a PostgreSQL database and runtime secrets configured in your environment. For example:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@db-host:5432/velora?schema=public" \
  -e AUTH_SECRET="replace-with-a-long-random-secret" \
  -e NEXT_PUBLIC_APP_URL="https://your-domain.example" \
  velora:local
```

Configure any integrations you use (SMTP, Cloudinary, Google OAuth, and PayHere) in the container environment as well. Run database migrations as a deployment step before serving traffic. This repository does not include a Docker Compose file or an automated image-publishing/deployment workflow.

For Vercel, connect the repository and configure the environment variables in the Vercel project. Apply database migrations as a separate release step. `next.config.ts` leaves standalone output disabled when the `VERCEL` environment variable is present.

## Repository layout

```text
src/
  app/                 Next.js pages, route handlers, and server actions
  components/          Storefront, checkout, account, admin, and auth UI
  lib/                 Database, auth, business logic, integrations, validation
  store/               Zustand cart store
  types/               Shared TypeScript declarations
prisma/
  schema.prisma        PostgreSQL domain schema
  migrations/          Versioned database migrations
  seed.ts              Local demo data reset and seed
.github/workflows/     CI workflow
Dockerfile             Multi-stage production image
```
