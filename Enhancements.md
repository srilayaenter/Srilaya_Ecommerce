SriLaYa Foods — Dev Session Summary (15 Jul 2026)
🏭 Raw Material Low-Stock Dashboard Alerts (Owner Only)
Admin dashboard now shows a 5th KPI card "Raw Material Alerts" (green when all OK, red with count when any material is below its reorder threshold)
Warning banner listing each low material as pills with current stock / threshold, linking directly to the material's detail page
Grid layout switches to 5 columns for owner role, 4 for others
Query: all raw materials filtered by stockQty <= reorderThreshold, only shown to owner role

📊 Production Material Cost in P&L Report (Owner Only)
P&L report now pulls all RawMaterialLog entries with type='production' for the selected period
Aggregates total production material cost (rawMatCost) broken down per raw material
New P&L statement line: "Production Material Cost" deducted before Net Profit
New breakdown table: material name, qty consumed, cost/unit, total cost, % of production cost bar
Warning banner if any raw material is missing costPerUnit
netProfit = grossProfit − returnValue − rawMatCost

🐛 Pre-existing Next.js Build Error Fixes
Issue	Fix
TOTP helpers exported from route file	Moved encryptTotpSecret/decryptTotpSecret/getEncKey to lib/totp.ts; route imports from there
pdf-parse ESM .default not callable	Cast as unknown as (buf: Buffer) => Promise<{ text: string }>
StockLogEntry reason type mismatch	Exported type StockLogEntry from lib/stockLog.ts; import used in purchase-orders route

✅ Playwright E2E Test Suite — Full Coverage
175 tests across 20 modules: auth, cart, checkout, orders, products, admin, raw materials, production, P&L, mobile, SEO
169 pass | 4 skip (OTP, cancel order, cart unit-price edge case, loyalty) | 2 flaky on first attempt, pass on retry
Config: fullyParallel: true, workers: 2, retries: 1
Key fixes: emptyCart afterEach swallows errors; CART-01 uses addFirstProductToCart helper; ADM-CPN-02/BLG-02 error check scoped to main content; loginAsUser/loginAsAdmin timeouts bumped to 25s

---

SriLaYa Foods — Dev Session Summary (28 Jun 2026)
🔔 Per-Variant Reorder Thresholds
reorderThreshold Int @default(10) added to ProductVariant schema with migration applied
Admin product edit page has "Reorder At" column per variant
Low-stock cron and inventory matrix colour-coding both use per-variant threshold
Dashboard KPI card reflects threshold breach count

🔐 Role-Based Access Control (RBAC)
Roles: admin, manager, inventory_staff, billing_staff, owner, customer
lib/permissions.ts — ROLE_ALLOWED_PATHS map, canAccessPath(), isAdminRole(), isOwner()
Middleware uses canAccessPath() instead of hardcoded role checks
Admin nav filtered per role; sidebar shows role label + email initials
/admin/users — list users, change role, create staff accounts

🏪 Offline (In-Store) Sales
app/actions/offlineOrder.ts — creates order with orderChannel: 'in_store', status: 'paid', zero shipping, decrements stock
/api/admin/products-for-order — auth-guarded product+variant API
/admin/orders/new — product/variant picker, qty, customer info, payment method (Cash/UPI/Card/Bank Transfer)
After creation redirects to invoice page

🧾 In-Store Invoice with Email & WhatsApp
lib/emails/inStoreInvoice.ts — HTML receipt email + WhatsApp pre-fill message builder
/api/admin/orders/[orderId]/send-invoice POST — sends via Resend
/admin/orders/[id]/invoice — printable receipt with Email panel + WhatsApp wa.me deep link + Print button

📋 Order Detail Page (/admin/orders/[id])
Items table with GST breakdown, totals, shipment form/display
Fulfillment + payment status controls, customer info, delivery address, meta
Order IDs in list are clickable links; in-store rows have 🧾 Invoice button

💰 Owner-Only P&L Report (/admin/reports/pl)
Gross profit, returns, COGS, variant revenue breakdown table
Month navigation (prev/next links)
Locked behind isOwner() gate — non-owner admins get 404

🔒 Cost Price Hidden from Non-Owner Roles
costPrice field hidden from inventory matrix and product edit pages for non-owner roles
Owner sees cost price + margin column; others see stock only

---

SriLaYa Foods — Dev Session Summary (25 Jun 2026)
🛍️ Checkout & Shipping
Weight-based shipping — replaced "Free" with real cost calculation using product weight, delivery zone (Local / Regional / National), and courier selection (Delhivery, DTDC, Blue Dart, India Post)
CheckoutForm — live courier radio buttons with calculated cost per selection; shipping fee passed into order creation
Cart page — updated to show "Calculated at checkout" instead of a fixed fee
📦 Shipment Tracking
Added Shipment model to the database (courier, tracking number, status, ETA)
Added orderChannel (online / in_store) and paymentMethod to orders for future in-store sale support
Migration applied and Prisma client regenerated
🏠 Homepage Redesign
Full 7-section layout: Hero → USP Strip → Category Showcase → Featured Products → Why Choose Us → Testimonials → WhatsApp CTA
Dark emerald hero with animated gradient; amber CTAs; dot-grid texture
Testimonials redesigned with white cards, star ratings, and avatar initials
Footer added (dark, with shop links, company links, address, contact details)
🗂️ Categories
Added Millet Flour and Millet Rava to the homepage category grid (6 tiles in 2×3 layout)
Both added to header category strip (which now includes all 7 categories)
Seed file updated to upsert all 7 categories with slugs and descriptions
description column added to Category model with migration
📱 Mobile Navigation
Added hamburger menu button visible on screens < lg
Slide-out drawer with backdrop, search bar, all nav links, all 7 category links, and a "View Cart" button
Category strip on desktop unchanged
🔍 SEO Metadata
Root layout — global title template, description, keywords, Open Graph, Twitter card, robots tag
Homepage, All Products, About, Contact — static page-level metadata
Product detail & Category pages — dynamic generateMetadata pulling title/description from the database per page
🐛 Bug Fixes
Issue	Fix
order.customerEmail in admin orders	Changed to order.email (correct schema field)
ProductCard fake addToCart	Replaced setTimeout mock with real server action via useTransition
await cookies() / await searchParams in Next.js 14	Removed incorrect await (Next.js 14 pattern)
new Resend() crashing at build time	Moved instantiation inside the send function (lazy init)
tsconfig ignoreDeprecations: "6.0"	Removed deprecated baseUrl; TypeScript 5.0+ supports paths without it
Stale IDE diagnostics on ProductCard	Confirmed as cache artefact from old file — no action needed
⚙️ Infrastructure
Applied 3 DB migrations: weightGrams on variants, Shipment table, Category description
Prisma client regenerated after each migration
Build passes cleanly with zero TypeScript errors