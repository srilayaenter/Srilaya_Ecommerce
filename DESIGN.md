# SriLaYa Naturals — Application Design Document

**Version:** 2.0  
**Last Updated:** 15 July 2026  
**Status:** Production Ready  
**Stack:** Next.js 14 · Prisma · Supabase · Vercel  
**Test Coverage:** 169 / 175 E2E tests passing  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Model](#4-data-model)
5. [Roles & Permissions](#5-roles--permissions)
6. [Authentication](#6-authentication)
7. [Security Architecture](#7-security-architecture)
8. [Customer Journey](#8-customer-journey)
9. [Admin Operations](#9-admin-operations)
10. [Owner-Only Features](#10-owner-only-features)
11. [Offline (In-Store) Sales](#11-offline-in-store-sales)
12. [Module Reference](#12-module-reference)
13. [API Reference](#13-api-reference)
14. [Integrations](#14-integrations)
15. [Infrastructure & Deployment](#15-infrastructure--deployment)
16. [Environment Variables](#16-environment-variables)

---

## 1. Executive Summary

SriLaYa Naturals is a full-stack B2C eCommerce platform for selling organic millet-based food products. The platform serves three distinct audiences: **customers** browsing and purchasing online, **admin staff** managing day-to-day operations, and the **owner** overseeing financials, raw material inventory, and production.

### Business Capabilities

| Capability | Description | Audience |
|---|---|---|
| Online Store | Product catalog with variants, categories, bundles, search, reviews, wishlists | Customers |
| Checkout | Cart → address → courier selection → COD or Razorpay online payment | Customers |
| Order Management | Order tracking, cancellation, returns, invoices, shipment updates | Customers + Admin |
| Loyalty & Referral | Points earned on purchase, redeemable at checkout; referral bonus system | Customers |
| Admin Dashboard | KPI cards, sales analytics, GST report, low-stock alerts | Admin + Owner |
| Inventory Management | Stock levels, CSV import, purchase orders, stock log, per-variant reorder thresholds | Admin + Owner |
| Offline (In-Store) Sales | POS-style order creation for walk-in customers, with printable invoice | Admin + Owner |
| Raw Material Management | Track raw material stock, recipes, production batches, purchase bill import (AI-assisted) | Owner Only |
| P&L Report | Monthly profit & loss with COGS, production material cost, returns, net profit | Owner Only |
| Communications | Transactional emails (order confirmation, dispatch, invoice), WhatsApp notifications, OTP SMS | System |

---

## 2. System Architecture

### Component Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│                  Browser / Mobile                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│               Vercel (Edge + Serverless)                     │
│                                                              │
│  ┌─────────────────────┐  ┌────────────────────────────┐    │
│  │  Next.js Middleware  │  │  Next.js App Router        │    │
│  │  (RBAC + Auth Gate) │  │  Server Components +        │    │
│  └─────────────────────┘  │  Server Actions + API Routes│    │
│                            └────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Vercel Cron Jobs (4 schedules)             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   External Services                          │
│                                                              │
│  Supabase PostgreSQL  │  Razorpay  │  Resend  │  Twilio     │
│  (Prisma ORM)         │  Payments  │  Email   │  SMS/WA     │
│                       │            │          │              │
│  Anthropic Claude AI  │  Google OAuth                        │
│  (PDF Parsing)        │  (Social Login)                      │
└──────────────────────────────────────────────────────────────┘
```

### Request Flow

All requests enter through Vercel's edge network. The **Next.js Middleware** runs first on every request to `/admin/*`, enforcing authentication and role-based path gating before the request reaches any page or API handler. Server Components fetch data directly from the database (no intermediate API hop), while client interactions trigger Server Actions or API routes.

### Rendering Strategy

| Area | Rendering | Reason |
|---|---|---|
| Product listing, detail, category | Server Components (dynamic) | Live stock + price |
| Homepage, blog, legal pages | Server Components (cached) | Infrequently changing |
| Cart, checkout | Server Components + Server Actions | Session-bound, must be fresh |
| Admin dashboard, reports | Dynamic Server Components | Real-time KPIs |
| Shop header / cart badge | Client Component | Updates after server actions |
| Product review form, POS form | Client Components | Interactive forms |

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.2.3 | SSR, routing, middleware, server actions |
| UI | React | 18.2 | Component model |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| ORM | Prisma | 6.19 | Type-safe DB access, migrations |
| Database | PostgreSQL (Supabase) | — | Primary datastore, Mumbai region |
| Auth | NextAuth.js | 4.24 | JWT sessions, Google OAuth, credentials |
| Payments | Razorpay SDK | 2.9 | Online payment processing |
| Email | Resend | 4.x | Transactional emails with HTML templates |
| SMS / WhatsApp | Twilio | 6.x | OTP delivery, order notifications |
| AI | Anthropic Claude API | 0.111 | PDF purchase bill parsing |
| PDF | pdfkit | 0.19 | Tax invoice PDF generation |
| PDF Parsing | pdf-parse | 2.4 | Extract text from uploaded bills |
| MFA | otplib + qrcode | 13.x / 1.5 | TOTP setup and verification |
| Validation | Zod | 4.x | Runtime schema validation on API routes |
| Password hashing | bcryptjs | 2.4 | Bcrypt cost 12 |
| Testing | Playwright | 1.61 | End-to-end test suite (175 tests) |
| Hosting | Vercel | — | Deployment, edge CDN, cron jobs |
| Language | TypeScript | 5.5 | End-to-end type safety |

---

## 4. Data Model

All models use PostgreSQL via Prisma ORM (schema at `packages/db/prisma/schema.prisma`).

### Core Entities

| Model | Key Fields | Notes |
|---|---|---|
| `User` | id, email?, phone?, password?, role, totpEnabled | Supports email, phone, and Google OAuth sign-in |
| `Product` | id, slug, title, gstRate, sku, active, categoryId | Parent entity; variants hold stock and pricing |
| `ProductVariant` | id, productId, size, price, costPrice?, stock, reorderThreshold, weightGrams, active | costPrice visible to owner only |
| `Cart` | id, userId?, email?, reminderSentAt | Identified by HTTP-only cookie `cartId` |
| `Order` | id, status, fulfillmentStatus, orderChannel, paymentMethod, subtotal, taxTotal, shippingFee, total | orderChannel: online \| in_store |
| `Shipment` | orderId (unique), courier, trackingNumber, status, estimatedDelivery | One-to-one with Order |
| `RawMaterial` | id, name, unit, stockQty, costPerUnit?, reorderThreshold | Owner-only feature |
| `LadduRecipe` | variantId (unique), yieldKg | One recipe per variant; linked to RecipeLines |
| `RecipeLine` | recipeId, rawMaterialId, qtyPerYield | How much of each raw material per kg yield |
| `ProductionBatch` | variantId, unitsProduced, producedAt | Each batch logs raw material deductions |
| `RawMaterialLog` | rawMaterialId, type, qty, batchId? | type: purchase \| production \| adjustment |
| `LoyaltyAccount` | email (unique), balance, totalEarned, referralCode? | Linked by email, not user ID |
| `Coupon` | code (unique), type (percentage\|fixed), value, minOrder?, maxUses?, usedCount | |
| `StockLog` | variantId, delta, reason, createdAt | Audit trail for all stock movements |
| `WebhookEvent` | eventId (unique) | Idempotent dedup for Razorpay webhooks |
| `FailedEmail` | recipient, subject, html, createdAt | Fallback table; purged after 30 days |

### Full Model List (30+)

`User` · `PhoneOtp` · `PasswordResetToken` · `Category` · `Product` · `ProductImage` · `ProductReview` · `ProductVariant` · `Bundle` · `BundleItem` · `Cart` · `CartItem` · `Order` · `Shipment` · `OrderItem` · `WebhookEvent` · `FailedEmail` · `Supplier` · `PurchaseOrder` · `PurchaseOrderItem` · `Coupon` · `Return` · `ReturnItem` · `StockNotification` · `LoyaltyAccount` · `LoyaltyTransaction` · `BlogPost` · `StockLog` · `RawMaterial` · `LadduRecipe` · `RecipeLine` · `ProductionBatch` · `RawMaterialLog`

### Order Status Lifecycle

```
pending → cod_pending → processing → shipped → delivered
                  ↘ cancelled
paid (online) → processing → shipped → delivered
in_store → paid (directly)
```

---

## 5. Roles & Permissions

Six role levels gate access to admin features. Enforced in middleware (`lib/permissions.ts` → `canAccessPath()`) and on individual pages (`isOwner()`, `requireRole()`).

| Role | Pages Accessible | Special Capabilities |
|---|---|---|
| `owner` | All admin pages | P&L report, raw materials, recipes, production, cost prices, margin data, profit alerts on dashboard |
| `admin` | All admin pages except owner-only | Full CRUD on products, orders, users, coupons, blogs, bundles, analytics, GST report |
| `manager` | Orders, Products, Categories, Suppliers, Analytics, Returns, Coupons, Bundles, Reviews, Blog | Cannot access user management or raw materials |
| `inventory_staff` | Products, Categories, Suppliers only | Stock updates; cannot see orders or financials |
| `billing_staff` | Orders only | Process orders, update fulfillment status; no product access |
| `customer` | Shop pages only | Account, orders, wishlist, reviews; blocked from all /admin routes |

> **Cost price visibility:** The `costPrice` field on `ProductVariant` is only rendered for the owner role. All other roles — including admin — see stock quantities and selling prices but never cost or margin data.

---

## 6. Authentication

NextAuth.js with JWT sessions. Three sign-in methods for customers; email+password for admin staff.

### Sign-in Methods

| Method | Provider | Audience | Notes |
|---|---|---|---|
| Email + Password | CredentialsProvider (id: credentials) | Customers + Admin | bcrypt cost 12; admin uses `/admin/login` |
| Google OAuth | GoogleProvider | Customers | Auto-creates User on first sign-in with role: customer |
| Phone OTP | CredentialsProvider (id: phone-otp) | Customers | OTP via Twilio SMS; max 5 attempts; 10-min expiry |

### Admin MFA Flow

```
/admin/login → JWT issued (totpPending: true) → /admin/mfa-verify → totpPending cleared → Full access
```

TOTP secrets are AES-256-CBC encrypted before storage using `NEXTAUTH_SECRET` as the key. Format stored: `enc:<iv>:<ciphertext>`. Five consecutive wrong TOTP codes trigger a 15-minute lockout per user.

### Password Reset Flow

Reset tokens are SHA-256 hashed before storage (DB breach cannot yield valid tokens). Tokens expire in 1 hour. Rate limited to 3 requests per 15 minutes per IP address.

---

## 7. Security Architecture

| Area | Control | Implementation |
|---|---|---|
| Passwords | Adaptive hashing | bcrypt cost 12 |
| TOTP secrets | Encryption at rest | AES-256-CBC keyed from NEXTAUTH_SECRET |
| Password reset tokens | Hashed storage | SHA-256 before DB write; token never stored in plain text |
| Sessions | Stateless JWT | Signed with NEXTAUTH_SECRET; no DB session table to attack |
| Admin access | Middleware + RBAC | Every /admin/* request evaluated against canAccessPath() before rendering |
| MFA brute-force | Attempt lockout | 5 wrong codes → 15-minute freeze per user |
| OTP brute-force | Attempt counter | Max 5 attempts on PhoneOtp record; expired or exhausted records deleted |
| Forgot password | Rate limiting | 3 requests / 15 min per IP |
| Payment amount | Server-side amount | Amount always read from DB Order record; client-supplied values ignored |
| Payment verification | Signature + order check | razorpay_order_id validated against stored paymentId; prevents cross-order replay |
| Webhook idempotency | Dedup table | WebhookEvent.eventId (unique) prevents double-processing |
| Order tracking | Exact match | Requires order ID + email or phone; rate limited 10 req / 10 min per IP |
| Cron jobs | Bearer token | CRON_SECRET required on all /api/cron/* routes |
| Input validation | Zod schemas | All public-facing API routes validate request body via Zod before processing |
| PII retention | Auto-purge | FailedEmail records (containing recipient email) purged after 30 days |
| Cart session | HTTP-only cookie | cartId cookie is httpOnly; not accessible from JavaScript |

---

## 8. Customer Journey

### Discovery → Purchase Flow

```
Browse (/product, /category/[slug], /bundles)
  → Product Detail (/product/[slug])
    → Select Variant + Quantity
      → Add to Cart (Server Action)
        → Cart (/cart)
          → Checkout (/checkout)
            → COD: Order Created → /checkout/confirm/[id]
            → Online: Razorpay Modal → /checkout/pay/[id]
                       → Webhook: payment.captured → Order marked paid → confirmation
```

### Cart Behaviour

- Cart is identified by an HTTP-only `cartId` cookie (7-day expiry).
- Cart is linked to a `User` when logged in; anonymous carts merge on sign-in.
- Stock is validated server-side on every `addToCart` call — out-of-stock variants are rejected.
- Abandoned carts idle for 2+ hours trigger a recovery email (hourly cron).

### Checkout Inputs

| Field | Validation | Notes |
|---|---|---|
| Customer name, email, phone | Required strings | Phone used for WhatsApp invoice |
| Delivery address, city, state, zip | Required strings | State determines shipping zone (Local / Regional / National) |
| Courier selection | Must be one of available couriers for zone | Shipping cost calculated server-side by zone + weight |
| Coupon code | Validated server-side on order creation | Percentage or fixed discount; minOrder and maxUses enforced |
| Loyalty points | Max 10% of order value; min 100 points | Server-side cap enforced even if client sends higher amount |

### Post-Order Actions

- **Track order:** `/track` — enter order ID + email/phone
- **Cancel order:** Account page → cancel button (only eligible orders)
- **Return request:** Submits a `Return` record; notifies admin via email
- **Download invoice:** `/orders/[id]/invoice` — printable PDF receipt
- **Back-in-stock alerts:** `StockNotification` email sent when variant restocked

---

## 9. Admin Operations

### Order Fulfilment Workflow

```
New Order (email alert) → Processing (admin action) → Add Shipment (courier + AWB) → Shipped (customer notified) → Delivered (loyalty points credited)
```

### Inventory Management

- **Product edit page** — update stock directly per variant; "Reorder At" threshold per variant
- **CSV stock import** — bulk update via `/admin/inventory-import`; maps by SKU
- **Purchase orders** — create PO per supplier → mark received → stock auto-incremented
- **Stock log** — full audit trail of every stock change with reason code and timestamp
- **Low-stock cron** — daily 9 AM check; emails admin if any variant is below its reorder threshold

### Key Admin Pages

| Page | Route | Purpose |
|---|---|---|
| Dashboard | /admin | KPI cards: revenue, orders, customers, stock alerts, raw material alerts (owner) |
| Orders | /admin/orders | List, filter, export CSV; click → full order detail |
| Order Detail | /admin/orders/[id] | Items, GST breakdown, shipment form, status controls, customer info |
| New Order (POS) | /admin/orders/new | In-store sale creation with product picker |
| Products | /admin/products | Inventory matrix with stock, status, variant management |
| Analytics | /admin/analytics | Revenue trends, top products, order volume charts |
| GST Report | /admin/gst-report | Monthly GSTR-ready breakdown by tax rate |
| Coupons | /admin/coupons | Create and manage discount codes |
| Returns | /admin/returns | Review, approve/reject return requests |
| Blog | /admin/blog | Create and publish blog posts |
| Users | /admin/users | List all users, change roles, create staff accounts |

---

## 10. Owner-Only Features

Features gated behind the `owner` role, enforced by `isOwner()` on every page and API route.

### Raw Material Management

| Page | Route | What it does |
|---|---|---|
| Raw Materials List | /admin/raw-materials | All materials with stock levels, add-stock inline form, low-stock highlighting |
| Material Detail | /admin/raw-materials/[id] | KPI cards (stock, threshold, cost, total value), edit form, stock log history |
| Purchase Bill Import | /admin/raw-materials/import | Manual entry or AI-assisted PDF parsing to record incoming stock |
| Recipes | /admin/raw-materials/recipes | Define ingredients per variant (qty per kg yield) |

### Production Tracking

When a production batch is logged, the system atomically:

1. Increments the finished `ProductVariant` stock by `unitsProduced`
2. Decrements each raw material in the recipe by `qtyPerYield × units`
3. Creates `RawMaterialLog` entries (type: `production`, qty: negative) for each material
4. Logs a `StockLog` entry for the variant (reason: `manual_edit`)

### P&L Report

Monthly view at `/admin/reports/pl`. Components:

- **Gross Revenue** — sum of order totals in period
- **Variant COGS** — sum of (costPrice × qty) for all OrderItems where costPrice is set
- **Production Material Cost** — sum of (|qty| × costPerUnit) from RawMaterialLog type=production in period
- **Returns / Refunds** — total refund value from approved returns
- **Net Profit** = Gross Revenue − Variant COGS − Production Material Cost − Returns
- **Breakdown tables** — per-variant revenue/margin and per-raw-material consumption cost

> A warning banner is shown if any raw material used in production is missing a `costPerUnit`, as this means the production cost calculation is incomplete for that material.

### Dashboard Alert Card

The owner sees a "Raw Material Alerts" KPI card on the admin dashboard. It is green ("All OK") when all materials are above their reorder threshold, and turns red with the count when any material is below. A warning banner below the KPIs lists each low material as a pill linking to its detail page.

---

## 11. Offline (In-Store) Sales

POS-style order creation for walk-in customers at the physical store.

```
Admin opens /admin/orders/new
  → Select Products + Quantities
    → Enter Customer Name + Phone
      → Select Payment (Cash / UPI / Card / Bank)
        → Create Order (Server Action)
          → Stock Decremented, Order: in_store + paid
            → /admin/orders/[id]/invoice
              → Print | Email (Resend) | WhatsApp (wa.me deep link)
```

In-store orders bypass the cart and payment gateway entirely. They are created directly as `status: paid` and `orderChannel: in_store`. No shipping fee is applied. Stock is decremented atomically in the same transaction as order creation.

---

## 12. Module Reference

### Customer (Shop) Pages

| Route | Page | Auth Required |
|---|---|---|
| / | Homepage — hero, categories, featured products, testimonials | No |
| /product | Product listing with filters | No |
| /product/[slug] | Product detail — gallery, variants, add to cart, reviews | No |
| /category/[slug] | Category-filtered product grid | No |
| /search | Search results page | No |
| /bundles | Bundle listings | No |
| /cart | Shopping cart | No |
| /checkout | Checkout form — address, courier, payment | No (prefills if logged in) |
| /checkout/confirm/[id] | COD order confirmation | No |
| /checkout/pay/[id] | Razorpay payment initiation | No |
| /account | Customer account — profile, orders, password change | Customer |
| /orders/[id] | Customer order detail | Customer (own orders only) |
| /orders/[id]/invoice | Customer downloadable invoice | Customer (own orders only) |
| /wishlist | Saved product wishlist | Customer |
| /track | Track order by ID + contact | No |
| /referral | Referral code and loyalty balance | Customer |
| /blog | Blog listing | No |
| /blog/[slug] | Blog post detail | No |
| /about, /contact, /payments | Static info pages | No |
| /privacy, /terms, /shipping-policy, /returns-policy | Legal pages | No |

### Admin Pages

| Route | Purpose | Min Role |
|---|---|---|
| /admin | Dashboard with KPI cards and alerts | inventory_staff |
| /admin/products | Inventory matrix — stock, variants, edit | inventory_staff |
| /admin/products/new | Create new product | admin |
| /admin/products/[id] | Edit product, variants, images | inventory_staff |
| /admin/categories | Manage product categories | inventory_staff |
| /admin/suppliers | Supplier management | inventory_staff |
| /admin/purchase-orders | Create and receive purchase orders | inventory_staff |
| /admin/inventory-import | Bulk stock update via CSV | inventory_staff |
| /admin/stock-log | Full stock audit trail | inventory_staff |
| /admin/orders | Order list with export | billing_staff |
| /admin/orders/[id] | Order detail + status + shipment | billing_staff |
| /admin/orders/new | Create offline/in-store order | billing_staff |
| /admin/orders/[id]/invoice | Invoice with email/WhatsApp send | billing_staff |
| /admin/customers | Customer list | manager |
| /admin/returns | Return request management | manager |
| /admin/coupons | Discount code management | manager |
| /admin/bundles | Bundle product management | manager |
| /admin/reviews | Review moderation | manager |
| /admin/blog | Blog post management | manager |
| /admin/analytics | Sales and revenue charts | manager |
| /admin/gst-report | GSTR-ready tax report | admin |
| /admin/loyalty | Loyalty account management | admin |
| /admin/failed-emails | View and retry failed emails | admin |
| /admin/users | User roles and staff accounts | admin |
| /admin/settings | Admin password change, MFA setup | admin |
| /admin/raw-materials | Raw material stock management | **owner** |
| /admin/raw-materials/[id] | Material detail, edit, log | **owner** |
| /admin/raw-materials/import | Purchase bill import (AI + manual) | **owner** |
| /admin/raw-materials/recipes | Production recipe editor | **owner** |
| /admin/production | Log production batches | **owner** |
| /admin/reports/pl | Monthly P&L report | **owner** |

---

## 13. API Reference

### Authentication

| Method | Route | Purpose |
|---|---|---|
| GET/POST | /api/auth/[...nextauth] | NextAuth session handler |
| POST | /api/auth/register | Customer self-registration |
| POST | /api/auth/otp/send | Send OTP via Twilio SMS |
| POST | /api/auth/forgot-password | Issue password-reset token, email link |
| POST | /api/auth/reset-password | Consume token, set new password |
| POST | /api/auth/mfa-setup | Generate TOTP secret, return QR code URI |
| POST | /api/auth/mfa-verify | Verify TOTP code, enable MFA on account |

### Payments

| Method | Route | Purpose |
|---|---|---|
| POST | /api/payments/razorpay/order | Create Razorpay order; returns order ID for client SDK |
| POST | /api/payments/razorpay/verify | Verify payment signature post-payment |
| POST | /api/payments/razorpay/webhook | Idempotent webhook: marks order paid, emails, loyalty points, WhatsApp |

### Cart & Orders (Customer)

| Method | Route | Purpose |
|---|---|---|
| GET | /api/cart/count | Return cart item count for header badge |
| POST | /api/cart/reorder | Re-add items from past order to cart |
| POST | /api/cart/email | Save email to cart for abandoned-cart tracking |
| POST | /api/cart/add-bundle | Add all items in a bundle to cart |
| GET | /api/account/orders | List orders for logged-in customer |
| POST | /api/account/change-password | Change customer account password |
| POST | /api/orders/cancel | Customer-initiated order cancellation |
| POST | /api/orders/return | File a return request |
| GET | /api/track | Order tracking lookup (order ID + email/phone) |

### Products, Coupons, Loyalty

| Method | Route | Purpose |
|---|---|---|
| GET | /api/products/[slug]/recommendations | Related product suggestions |
| POST | /api/products/notify-stock | Register email for back-in-stock alert |
| GET/POST | /api/products/reviews | Read and submit product reviews |
| GET | /api/search | Full-text product search |
| POST | /api/coupons/apply | Validate and apply coupon code |
| GET | /api/loyalty/balance | Return current loyalty point balance |
| POST | /api/referral | Look up or create referral code |
| GET | /api/pincode/[pin] | Check delivery serviceability |
| POST | /api/contact | Contact form submission → admin email |

### Admin APIs (auth-gated)

| Method | Route | Purpose |
|---|---|---|
| GET | /api/admin/products-for-order | Lightweight product list for POS form |
| GET | /api/admin/orders/export | Export orders to CSV |
| POST | /api/admin/orders/[id]/send-invoice | Email PDF invoice to customer via Resend |
| POST | /api/admin/inventory/import | Bulk stock update from CSV |
| GET | /api/admin/inventory/export | Export inventory CSV |
| GET | /api/admin/stock-log | Paginated stock audit log |
| POST | /api/admin/parse-purchase-bill | Claude AI parses uploaded PDF bill → returns line items |
| POST | /api/admin/parse-evenmore-invoice | Claude AI parses Evenmore PDF invoice |
| GET/POST | /api/admin/suppliers | Supplier CRUD |
| GET/PUT/DELETE | /api/admin/purchase-orders/[id] | Purchase order management |
| GET/PUT | /api/admin/returns | Review and approve/reject returns |
| GET/PUT | /api/admin/reviews | Review moderation |
| GET/POST | /api/admin/blog | Blog post management |
| GET/POST | /api/admin/coupons | Coupon CRUD |
| GET | /api/admin/gst-report | GST breakdown report data |

### Cron Jobs

| Route | Schedule | Purpose |
|---|---|---|
| /api/cron/release-stock | Every 15 min | Release stock held by unpaid/expired orders |
| /api/cron/low-stock-check | Daily 9:00 AM UTC | Email admin if any variant falls below reorder threshold |
| /api/cron/abandoned-cart | Every hour | Send recovery email for carts idle 2+ hours |
| /api/cron/cleanup-failed-emails | Daily 2:00 AM UTC | Purge resolved FailedEmail records older than 30 days |

---

## 14. Integrations

### Razorpay (Payments)

- **Order creation:** `/api/payments/razorpay/order` creates a Razorpay order; amount read from DB (not client)
- **Client-side SDK:** Opens Razorpay checkout modal; on success, client calls `/api/payments/razorpay/verify`
- **Webhook:** `payment.captured` event marks order paid, triggers confirmation email and WhatsApp; idempotent via `WebhookEvent` table
- **Mode:** Currently test keys (`rzp_test_*`); switch to live before production

### Resend (Email)

- All transactional emails sent via Resend SDK with retry (3 attempts, exponential backoff)
- Failures written to `FailedEmail` table for manual review and retry
- Email types: order confirmation (with PDF invoice), dispatch notification, return request, low-stock alert, password reset, abandoned cart recovery, in-store invoice, back-in-stock notification
- **Current sender:** `onboarding@resend.dev` (free shared domain — must add custom domain before launch)

### Twilio (SMS + WhatsApp)

- **SMS:** OTP delivery for phone login; falls back to `console.log` in dev if env vars absent
- **WhatsApp:** Order confirmed, dispatched, delivered notifications; in-store invoice deep link via `wa.me`
- **Current:** Sandbox number `+14155238886`; apply for approved Business number before customers can receive WA messages without joining sandbox

### Anthropic Claude AI (PDF Parsing)

- Purchase bills and Evenmore invoices are uploaded as PDFs, parsed by `pdf-parse`, then sent to Claude via the Anthropic SDK
- Claude extracts vendor name, date, line items (material, qty, unit, cost) and returns structured JSON
- User reviews and confirms the extracted data before it is saved to the database

### Supabase (Database)

- PostgreSQL hosted on Supabase (Mumbai, ap-south-1)
- Accessed via Prisma ORM with a pooled connection (`DATABASE_URL`) for runtime and a direct connection (`DIRECT_URL`) for migrations
- Migrations run via `npx prisma migrate deploy` on Vercel build

### Google OAuth

- Customer sign-in via Google account
- On first sign-in, a `User` record is auto-created with `role: "customer"`
- Configured via `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

---

## 15. Infrastructure & Deployment

### Vercel Deployment

- The application is a Next.js monorepo with the web app at `apps/web` and the Prisma schema at `packages/db`
- Build command: `next build apps/web` (also runs `prisma migrate deploy` on each deploy)
- Environment variables are configured in the Vercel dashboard under Settings → Environment Variables
- Edge network provides global CDN for static assets and ISR pages

### Monorepo Structure

```
srilaya-ecommerce/
├── apps/
│   └── web/                  # Next.js application
│       ├── app/              # App Router (pages, layouts, API routes)
│       ├── lib/              # Shared utilities (email, auth, shipping, etc.)
│       └── public/           # Static assets
├── packages/
│   └── db/
│       └── prisma/
│           └── schema.prisma # Database schema
├── tests/
│   └── e2e/                  # Playwright test suite
├── playwright.config.ts
├── vercel.json               # Cron job definitions
└── package.json              # Scripts and dependencies
```

### Key Library Files

| File | Purpose |
|---|---|
| `lib/auth.ts` | NextAuth config, JWT callbacks, session shape |
| `lib/permissions.ts` | `canAccessPath()`, `isOwner()`, `requireRole()` |
| `lib/email.ts` | Resend wrapper with retry + FailedEmail fallback |
| `lib/totp.ts` | AES-256-CBC encrypt/decrypt for TOTP secrets |
| `lib/loyalty.ts` | Earn/redeem points logic |
| `lib/shipping.ts` | Zone detection + courier rate calculation |
| `lib/sms.ts` | Twilio SMS sender |
| `lib/whatsapp.ts` | Twilio WhatsApp sender |
| `lib/stockLog.ts` | `logStockChange()` — single place for all stock audit entries |
| `lib/stockNotifications.ts` | Back-in-stock email trigger |
| `lib/generateInvoicePdf.ts` | PDFKit tax invoice generator |
| `actions/orders.ts` | Full checkout pipeline server action |
| `actions/offlineOrder.ts` | In-store POS order server action |
| `actions/cart.ts` | `addToCart` server action |

### Testing

- **Framework:** Playwright with 2 parallel workers and 1 retry
- **Coverage:** 175 tests across 27 modules — 169 pass, 4 skip, 2 flaky-on-retry
- **Run:** `npm test` (requires dev server running on port 3000)
- **Report:** `npm run test:report` opens the HTML report

---

## 16. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **Required** | Supabase PostgreSQL pooled connection |
| `DIRECT_URL` | **Required** | Direct DB connection for Prisma migrations |
| `NEXTAUTH_SECRET` | **Required** | JWT signing key + TOTP AES-256 encryption key |
| `NEXTAUTH_URL` | **Required** | Base URL (used in email links, sitemaps) |
| `NEXT_PUBLIC_APP_URL` | **Required** | Public base URL (client-side accessible) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth — Google sign-in disabled if absent |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth secret |
| `RESEND_API_KEY` | Optional | Transactional email — emails silently skipped if absent |
| `EMAIL_FROM` | Optional | Sender address (e.g. orders@srilaya.com) |
| `ADMIN_ALERT_EMAIL` | Optional | Recipient for low-stock, return, and new-order alerts |
| `ADMIN_EMAIL` | Optional | Recipient for contact form submissions |
| `TWILIO_ACCOUNT_SID` | Optional | Twilio SMS/WhatsApp — falls back to console.log if absent |
| `TWILIO_AUTH_TOKEN` | Optional | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Optional | Twilio SMS sender number |
| `TWILIO_WHATSAPP_FROM` | Optional | WhatsApp sender (default: sandbox +14155238886) |
| `RAZORPAY_KEY_ID` | **Required** | Razorpay publishable key |
| `RAZORPAY_KEY_SECRET` | **Required** | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Webhook signature verification — payment webhooks fail without this |
| `CRON_SECRET` | **Required** | Bearer token protecting all /api/cron/* routes |
| `BRAND_GSTIN` | Optional | GSTIN printed on tax invoices |
| `ANTHROPIC_API_KEY` | Optional | Claude AI for PDF invoice parsing — AI import disabled if absent |

> **Pre-launch:** Switch Razorpay to live keys, set `NEXTAUTH_URL` to the production domain, add a custom email domain in Resend, and verify `BRAND_GSTIN` is set. See [SETUP.md](SETUP.md) for the full pre-launch checklist.

---

*SriLaYa Naturals — Confidential Internal Documentation*  
*Generated: 15 July 2026*
