# Velora

Velora is a full-stack fashion storefront for browsing clothing, choosing product variants, checking out, and tracking orders. It also includes account features and an admin area for maintaining the catalog and order workflow. The project is built with Next.js, React, TypeScript, PostgreSQL, and Prisma.

## Project overview

### Customer storefront

- Browse active products, search, sort, and filter by collection and subcategory.
- Open product pages with product images, size and colour variants, price, and stock information.
- Add variants to a persistent cart. Signed-in customers can sync cart contents across sessions.
- Save delivery addresses, apply eligible coupon codes, and complete checkout through PayHere.
- View order history, order details, and payment/order status in the customer account.
- Browse a responsive home page with collection entry points, selected products, and Unsplash photography.

### Accounts

- Register with an email address and password, then verify the account with an emailed one-time code.
- Sign in with credentials or Google OAuth when Google credentials are configured.
- Request a password reset using the emailed reset link/code.
- Manage delivery addresses and review orders.

### Admin (`/admin`)

- Create and update products, prices, inventory, and size/colour variants.
- Select several product images during product creation. After the product is saved, the images upload to Cloudinary; the product editor can later set the primary image, reorder, add, or remove images.
- Organize products with a top-level category and an optional subcategory.
- Update order status, manage users and roles, and create or manage coupon codes.

## Main technologies

| Area | Technology |
| --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript |
| Styling and icons | Tailwind CSS 4, Lucide React |
| Database | PostgreSQL |
| Data access | Prisma ORM 7 with the PostgreSQL driver adapter |
| Authentication | Auth.js / NextAuth, Prisma adapter, credentials and optional Google OAuth |
| Validation | Zod |
| Client cart state | Zustand with persisted browser storage |
| Cache and rate limits | Redis via ioredis; cache reads fail open when Redis is unavailable |
| Product image storage | Cloudinary |
| Email | Nodemailer over SMTP |
| Online payment | PayHere checkout and server notification handling |

## Application structure

```text
src/
├── app/
│   ├── (auth)/                 # Registration, verification, sign-in, password reset
│   ├── (shop)/                 # Shop, products, cart, checkout, payment results
│   ├── account/                # Customer profile, addresses, orders
│   ├── admin/                  # Catalog, categories, orders, users, coupons
│   └── api/                    # Auth, cart/order endpoints, image upload, payment webhook
├── components/
│   ├── account/                # Address and order account UI
│   ├── admin/                  # Admin forms, image manager, and table actions
│   ├── auth/                   # Registration and account access forms
│   ├── checkout/               # Address selection and checkout UI
│   ├── layout/                 # Store navigation and footer
│   └── shop/                   # Catalog, product, and cart UI
├── lib/                        # Prisma, Redis, email, payment, cart, and validation helpers
├── store/                      # Client-side Zustand stores
└── types/                      # Shared TypeScript types

prisma/
├── schema.prisma               # PostgreSQL data model
├── migrations/                 # Database migration history
└── seed.ts                     # Local demo users, categories, products, and coupons
```

The App Router pages render the main customer and admin experiences. Mutations use Server Actions where form state and revalidation are useful, and Route Handlers for operations such as cart/order APIs, image uploads, and PayHere notifications. Shared Zod schemas validate product, category, and checkout data. Prisma models users, accounts, addresses, products, variants, images, carts, orders, payments, and coupons.

Product categories are hierarchical: a category may have child categories, while a product stores its main category and an optional subcategory. Inventory and price belong to individual product variants. Product image URLs and Cloudinary public IDs are stored separately from product records, allowing the admin image manager to change gallery order and primary-image selection.

## Local setup

### Requirements

- Node.js and npm
- PostgreSQL
- Redis is recommended for catalog caching and rate limiting; the application defaults to `redis://localhost:6379` and handles Redis outages without failing catalog reads.
- Cloudinary, SMTP, Google OAuth, and PayHere credentials are needed only for the corresponding integrations.

### Install and configure

1. Install packages:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root. The file is ignored by Git. Add the variables needed for your local integrations:

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/velora"
   AUTH_SECRET="replace-with-a-long-random-secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   REDIS_URL="redis://localhost:6379"

   # Optional Google sign-in
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""

   # Optional SMTP email delivery
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_USER=""
   SMTP_PASSWORD=""
   SMTP_FROM="Velora <noreply@example.com>"

   # Required for admin product image uploads
   CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""

   # Required to accept PayHere payments
   PAYHERE_MERCHANT_ID=""
   PAYHERE_MERCHANT_SECRET=""
   PAYHERE_SANDBOX="true"
   PAYHERE_NOTIFY_URL="https://your-public-host/api/payments/payhere/notify"
   ```

   Password reset URL generation also checks `NEXTAUTH_URL` as a fallback if `NEXT_PUBLIC_APP_URL` is not set. Email configuration accepts `AUTH_EMAIL_USER` and `AUTH_EMAIL_PASSWORD` as fallbacks for `SMTP_USER` and `SMTP_PASSWORD`.

3. Generate the Prisma client and create/update the local database schema:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Optionally populate a local database with demo data:

   ```bash
   npm run seed
   ```

   The seed script creates demo accounts (`admin@velora.lk` / `admin123` and `customer@velora.lk` / `customer123`) along with catalog and coupon data. These are development credentials; change or remove them before using any shared environment, and do not run the demo seed against production data.

5. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

If SMTP is not configured or email delivery fails, verification codes and password reset links are logged by the server for local development. Treat those logs as sensitive and configure real SMTP delivery outside local development.

## Configuration notes

- `PAYHERE_SANDBOX=true` sends checkout to PayHere’s sandbox. Set it to `false` only when using live merchant credentials and a publicly reachable notification URL.
- The PayHere notification endpoint is `/api/payments/payhere/notify`. Configure the matching public URL in the PayHere merchant settings.
- Product image uploads require valid Cloudinary credentials. Uploads are limited to 5 MB per image by the admin image endpoint.
- `.env*`, generated Prisma output, build output, and dependencies are excluded from Git.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Build the application for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run seed` | Add or update local demo data |
| `npx prisma studio` | Inspect database records in Prisma Studio |

## Recent UI and workflow improvements

- The home page uses a more editorial layout, Unsplash imagery, clearer collection cards, and a focused featured-products section.
- Men, Women, and Kids navigation reflects the selected collection. The shop category filter narrows its options to the active collection and its subcategories.
- Product cards and the shared footer use a calmer, more consistent visual system. The home page no longer advertises the coupon offer, and the footer no longer displays a PayHere sandbox verification badge.
- Product creation accepts image selections in the initial form and uploads them after saving, instead of forcing admins to leave the creation flow to add the first images.
