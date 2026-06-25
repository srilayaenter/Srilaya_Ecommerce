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