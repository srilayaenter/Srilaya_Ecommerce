# SriLaYa Naturals — Test Cases
**Project:** srilaya-ecommerce | **Total Modules:** 20 | **Total TCs:** 150+

Format: `TC-[Module]-[Number] | Priority: P1/P2/P3 | Type: Manual/Automated`
- **P1** — Must pass before go-live
- **P2** — Should pass; degrades UX if failing
- **P3** — Nice to have

---

## MODULE 1 — AUTHENTICATION

### TC-AUTH-01 | P1 | Manual
**Email & Password Login — Happy Path**
- Steps: Go to `/login` → enter valid email & password → click Sign In
- Expected: Redirected to `/` or `callbackUrl`; session active; account icon updates

### TC-AUTH-02 | P1 | Manual
**Email & Password Login — Wrong Password**
- Steps: Enter valid email + wrong password → Sign In
- Expected: Error message shown; no redirect; stays on login page

### TC-AUTH-03 | P1 | Manual
**Email & Password Login — Non-existent Email**
- Steps: Enter unregistered email + any password → Sign In
- Expected: Generic error ("Invalid credentials"); no account enumeration leak

### TC-AUTH-04 | P1 | Manual
**Register — New User**
- Steps: Go to `/register` → fill name, email, password (8+ chars), confirm → Submit
- Expected: Account created; auto signed-in; redirected to `/`

### TC-AUTH-05 | P1 | Manual
**Register — Duplicate Email**
- Steps: Register with an already-used email
- Expected: 409 error "Email already in use"

### TC-AUTH-06 | P1 | Manual
**Register — Password Mismatch**
- Steps: Enter mismatched confirm password
- Expected: Client-side error before submit; form blocked

### TC-AUTH-07 | P1 | Manual
**Register — Weak Password**
- Steps: Submit password shorter than 8 characters
- Expected: Error "Password must be at least 8 characters"

### TC-AUTH-08 | P1 | Manual
**Phone OTP Login — Send OTP**
- Steps: `/login` → Phone OTP tab → enter 10-digit number → Send OTP
- Expected: "OTP sent" message; 60-second resend cooldown starts; OTP logged to console in dev

### TC-AUTH-09 | P1 | Manual
**Phone OTP Login — Verify OTP**
- Steps: Enter correct OTP within 10 minutes → Verify
- Expected: Logged in; session created; redirected

### TC-AUTH-10 | P1 | Manual
**Phone OTP Login — Wrong OTP**
- Steps: Enter incorrect OTP
- Expected: Error shown; attempt counter increments; blocked after 5 wrong attempts

### TC-AUTH-11 | P1 | Manual
**Phone OTP Login — Expired OTP**
- Steps: Wait 10+ minutes → enter OTP
- Expected: "OTP expired" error

### TC-AUTH-12 | P1 | Manual
**Phone OTP — Rate Limiting**
- Steps: Request OTP 3+ times within 10 minutes
- Expected: 4th request blocked with "Too many attempts" error

### TC-AUTH-13 | P2 | Manual
**Phone OTP — Invalid Phone Number**
- Steps: Enter 9-digit or non-numeric phone number
- Expected: Validation error before OTP is sent

### TC-AUTH-14 | P1 | Manual
**Admin Login — Valid Credentials**
- Steps: Go to `/admin/login` → enter admin email & password → Sign In
- Expected: Redirected to `/admin`; admin session active

### TC-AUTH-15 | P1 | Manual
**Admin Login — Customer Account Blocked**
- Steps: Try to login to `/admin/login` with a customer-role account
- Expected: Access denied; redirected back to login

### TC-AUTH-16 | P1 | Manual
**Protected Route — Unauthenticated Access**
- Steps: Visit `/account`, `/orders/[id]` without logging in
- Expected: Redirected to `/login?callbackUrl=...`

### TC-AUTH-17 | P1 | Manual
**Admin Protected Route — Unauthenticated**
- Steps: Visit `/admin` without admin session
- Expected: Redirected to `/admin/login`

### TC-AUTH-18 | P2 | Manual
**Sign Out**
- Steps: Go to `/account` while logged in → click Sign Out
- Expected: Session destroyed; redirected to `/`; cart badge resets

### TC-AUTH-19 | P2 | Manual
**Forgot Password — Admin**
- Steps: `/admin/forgot-password` → enter admin email → Submit
- Expected: "Reset link sent" message; email received with link

### TC-AUTH-20 | P2 | Manual
**Reset Password — Valid Token**
- Steps: Click reset link from email → enter new password → Submit
- Expected: Password updated; redirected to login

---

## MODULE 2 — PRODUCTS & CATALOG

### TC-PROD-01 | P1 | Manual
**Product Listing Page**
- Steps: Go to `/product`
- Expected: Products displayed in grid; images, names, prices visible; no broken `?` characters

### TC-PROD-02 | P1 | Manual
**Product Detail Page**
- Steps: Click any product → lands on `/product/[slug]`
- Expected: Title, image gallery, description, variants, price, Add to Cart visible

### TC-PROD-03 | P1 | Manual
**Variant Selection — Price Updates**
- Steps: On product page → change size dropdown from 250g to 500g
- Expected: Price updates correctly; gallery image updates if variant has own image

### TC-PROD-04 | P1 | Manual
**Out of Stock Variant**
- Steps: Select a variant with 0 stock
- Expected: "Out of Stock" shown; Add to Cart disabled; "Notify Me" button appears

### TC-PROD-05 | P2 | Manual
**Product Gallery — Image Switch**
- Steps: Click thumbnail images on product page
- Expected: Main image changes to selected thumbnail

### TC-PROD-06 | P1 | Manual
**Category Page**
- Steps: Go to `/category/millet-flakes`
- Expected: Only millet flake products shown; category name in heading

### TC-PROD-07 | P2 | Manual
**Search — Keyword Match**
- Steps: Type "barnyard" in search bar → submit
- Expected: Relevant products shown on `/search?q=barnyard`

### TC-PROD-08 | P2 | Manual
**Search — No Results**
- Steps: Search for "xyz123nonexistent"
- Expected: Empty state message shown; no broken page

### TC-PROD-09 | P2 | Manual
**Recently Viewed**
- Steps: Visit 3 different product pages → go to homepage
- Expected: Recently Viewed section shows those products

### TC-PROD-10 | P2 | Manual
**Product Reviews — Submit**
- Steps: On product page (logged in) → scroll to reviews → select 4 stars → write review → Submit
- Expected: Review submitted; pending approval message shown

### TC-PROD-11 | P2 | Manual
**Product Reviews — Display**
- Steps: Visit product with approved reviews
- Expected: Average rating shown; individual reviews listed with name, date, rating

### TC-PROD-12 | P3 | Manual
**Notify Me — Back in Stock**
- Steps: Click "Notify Me" on out-of-stock variant → enter email → Submit
- Expected: "We'll notify you" confirmation; no duplicate submissions for same email+variant

### TC-PROD-13 | P2 | Manual
**Product Recommendations**
- Steps: View a millet flakes product
- Expected: Recommendations section shows related millet products

---

## MODULE 3 — SHOPPING CART

### TC-CART-01 | P1 | Manual
**Add to Cart — Basic**
- Steps: On product page → select size → set quantity 2 → Add to Cart
- Expected: Cart badge increments by 2; success feedback shown

### TC-CART-02 | P1 | Manual
**Cart Page — View Items**
- Steps: Add 2 products → go to `/cart`
- Expected: Both items shown with image, name, size, quantity, price; subtotal correct

### TC-CART-03 | P1 | Manual
**Cart — Update Quantity**
- Steps: In cart → increase quantity of an item
- Expected: Line total and cart total update immediately

### TC-CART-04 | P1 | Manual
**Cart — Remove Item**
- Steps: Click remove/delete on a cart item
- Expected: Item removed; total recalculates; if last item, empty cart message shown

### TC-CART-05 | P1 | Manual
**Cart — Persist Across Pages**
- Steps: Add item to cart → navigate to homepage → return to cart
- Expected: Item still in cart (cookie-based persistence)

### TC-CART-06 | P2 | Manual
**Cart — Add Bundle**
- Steps: Go to `/bundles` → click "Add Bundle" on a bundle pack
- Expected: All bundle items added to cart; cart count increases accordingly

### TC-CART-07 | P2 | Manual
**Coupon — Valid Code**
- Steps: In cart → go to checkout → enter valid coupon code → Apply
- Expected: Discount shown; total reduced correctly; coupon label displayed

### TC-CART-08 | P2 | Manual
**Coupon — Invalid / Expired Code**
- Steps: Enter invalid or expired coupon code
- Expected: Error message "Invalid or expired coupon"; total unchanged

### TC-CART-09 | P2 | Manual
**Coupon — Minimum Order Not Met**
- Steps: Apply coupon with ₹500 minimum on ₹300 cart
- Expected: Error "Minimum order amount not met"

### TC-CART-10 | P1 | Manual
**Cart — Out of Stock Item**
- Steps: Add item → stock reduced to 0 by another user → attempt checkout
- Expected: Insufficient stock error; user informed which item is unavailable

---

## MODULE 4 — CHECKOUT & PAYMENTS

### TC-CHK-01 | P1 | Manual
**Checkout Form — Prefill for Logged-in User**
- Steps: Log in → add item → go to checkout
- Expected: Email and phone pre-filled from account

### TC-CHK-02 | P1 | Manual
**Checkout — Order Summary First on Mobile**
- Steps: Open checkout on mobile (< 768px)
- Expected: Order summary appears above the form

### TC-CHK-03 | P1 | Manual
**Checkout — Courier Selection**
- Steps: Fill state field → courier options appear
- Expected: Courier options with ETA and price shown; "Please select a courier" warning if none chosen

### TC-CHK-04 | P1 | Manual
**Checkout — COD Order Placement**
- Steps: Fill all fields → select Cash on Delivery → Place Order
- Expected: Redirected to `/checkout/confirm/[id]`; order in DB with status `cod_pending`

### TC-CHK-05 | P1 | Manual
**Checkout — Online Payment Flow**
- Steps: Fill all fields → select Pay Online → Continue to Payment
- Expected: Razorpay payment modal opens

### TC-CHK-06 | P1 | Manual
**Razorpay — Successful Payment**
- Steps: Complete Razorpay test payment (card: 4111 1111 1111 1111)
- Expected: Payment verified; order status set to `paid`; redirected to confirmation page

### TC-CHK-07 | P1 | Manual
**Razorpay — Failed Payment**
- Steps: Use test failure card in Razorpay
- Expected: Payment failure handled gracefully; user can retry; order stays `pending`

### TC-CHK-08 | P1 | Manual
**Checkout — Required Field Validation**
- Steps: Submit checkout form with empty Name field
- Expected: Browser validation blocks; error shown on required field

### TC-CHK-09 | P1 | Manual
**Checkout — Phone-only User (No Email)**
- Steps: Log in via Phone OTP (no email set) → go to checkout
- Expected: Email field marked optional; form submits without email; order saved with phone only

### TC-CHK-10 | P2 | Manual
**Loyalty Points — Redeem at Checkout**
- Steps: Have 100+ loyalty points → go to checkout → apply points
- Expected: Discount applied; total reduced; points deducted after order placed

### TC-CHK-11 | P2 | Manual
**Checkout — Referral Code Applied**
- Steps: Enter a valid referral code at checkout
- Expected: Code saved on order; referrer credited after delivery

### TC-CHK-12 | P1 | Manual
**Order Confirmation Page**
- Steps: Complete COD order → lands on `/checkout/confirm/[id]`
- Expected: Order ID, items, total, address shown; "Track Order" and WhatsApp share links visible

---

## MODULE 5 — ORDERS & MANAGEMENT

### TC-ORD-01 | P1 | Manual
**Order Detail — Customer**
- Steps: Go to `/orders/[id]` for own order
- Expected: Order items, status, shipping address, payment method, invoice download visible

### TC-ORD-02 | P1 | Manual
**Order Detail — Unauthorized Access**
- Steps: Try to access another user's `/orders/[id]`
- Expected: 404 or access denied; no order data leaked

### TC-ORD-03 | P1 | Manual
**Track Order — By Order ID**
- Steps: Go to `/track` → enter order ID + email/phone → Track
- Expected: Order status and shipment info shown

### TC-ORD-04 | P2 | Manual
**Track Order — Invalid ID**
- Steps: Enter non-existent order ID
- Expected: "Order not found" message

### TC-ORD-05 | P1 | Manual
**Cancel Order — Customer**
- Steps: In account → order with cancellable status → Cancel
- Expected: Order cancelled; stock restored; cancellation confirmation

### TC-ORD-06 | P1 | Manual
**Admin — View All Orders**
- Steps: Login to admin → go to `/admin/orders`
- Expected: Orders listed with status, customer name, total, date; filterable

### TC-ORD-07 | P1 | Manual
**Admin — Update Order Status**
- Steps: Open order in admin → change fulfillment status to "dispatched"
- Expected: Status updated in DB; dispatch email sent to customer with tracking info

### TC-ORD-08 | P1 | Manual
**Admin — Mark Delivered**
- Steps: Change fulfillment status to "delivered"
- Expected: Delivery email sent; loyalty points earned (if applicable)

### TC-ORD-09 | P1 | Manual
**Admin — Add Shipment Info**
- Steps: Open order → enter courier, tracking number → Save Shipment & Email Customer
- Expected: Shipment saved; dispatch email with tracking details sent to customer

### TC-ORD-10 | P2 | Manual
**Admin — Send Invoice Email**
- Steps: Open admin order invoice → click "Send Invoice"
- Expected: Invoice email with PDF attachment sent to customer email

### TC-ORD-11 | P2 | Manual
**Admin — Create Offline/Manual Order**
- Steps: Go to `/admin/orders/new` → fill customer, items, payment → Create
- Expected: Order created with `in_store` channel; appears in orders list

### TC-ORD-12 | P2 | Manual
**Admin — Export Orders CSV**
- Steps: Click Export on orders page
- Expected: CSV file downloads with all order fields

### TC-ORD-13 | P2 | Manual
**Invoice PDF — Download**
- Steps: Order detail → click Download Invoice
- Expected: PDF downloads; contains order items, GST breakdown, brand name "SriLaYa Naturals", GSTIN

---

## MODULE 6 — RETURNS & REFUNDS

### TC-RET-01 | P1 | Manual
**Submit Return Request**
- Steps: Go to delivered order → click "Request Return" → select reason → Submit
- Expected: Return request created; admin notified by email; confirmation shown to customer

### TC-RET-02 | P1 | Manual
**Admin — Approve Return**
- Steps: Admin → `/admin/returns` → approve a pending return
- Expected: Status updated to "approved"; customer notified

### TC-RET-03 | P2 | Manual
**Admin — Reject Return**
- Steps: Admin → reject a return with a note
- Expected: Status "rejected"; admin note saved; customer notified

### TC-RET-04 | P2 | Manual
**Return After 7 Days**
- Steps: Attempt to return an order delivered 8+ days ago
- Expected: Return button not shown or blocked with "Return window expired"

---

## MODULE 7 — COUPONS & DISCOUNTS

### TC-CPN-01 | P1 | Manual
**Admin — Create Coupon**
- Steps: `/admin/coupons` → Create new coupon with code "SAVE10", 10% off, no expiry → Save
- Expected: Coupon active in DB; usable at checkout

### TC-CPN-02 | P1 | Manual
**Coupon — Percentage Discount**
- Steps: Apply 10% off coupon on ₹500 cart
- Expected: ₹50 discount applied; total = ₹450

### TC-CPN-03 | P1 | Manual
**Coupon — Flat Discount**
- Steps: Apply ₹100 flat coupon on ₹500 cart
- Expected: ₹100 discount; total = ₹400

### TC-CPN-04 | P2 | Manual
**Coupon — Usage Limit Reached**
- Steps: Use coupon that has hit its max uses
- Expected: "Coupon no longer valid" error

### TC-CPN-05 | P2 | Manual
**Admin — Disable Coupon**
- Steps: Toggle coupon to inactive in admin
- Expected: Coupon rejected at checkout even with correct code

---

## MODULE 8 — BUNDLES

### TC-BDL-01 | P1 | Manual
**Bundle Listing**
- Steps: Go to `/bundles`
- Expected: Bundles shown with constituent items, original price, bundle price, savings badge

### TC-BDL-02 | P1 | Manual
**Add Bundle to Cart**
- Steps: Click "Add Bundle" on any bundle
- Expected: All bundle items added; cart count correct; redirect to cart

### TC-BDL-03 | P2 | Manual
**Admin — Create Bundle**
- Steps: `/admin/bundles` → select 3 products → set bundle price → Create
- Expected: Bundle visible on `/bundles`

---

## MODULE 9 — LOYALTY & REFERRAL

### TC-LOY-01 | P1 | Manual
**Earn Points on COD Order**
- Steps: Place a COD order as logged-in user → mark as delivered (admin)
- Expected: Loyalty points credited to account; visible on account page

### TC-LOY-02 | P1 | Manual
**Earn Points on Paid Order**
- Steps: Complete a Razorpay paid order
- Expected: Points credited after payment confirmation

### TC-LOY-03 | P1 | Manual
**Redeem Points at Checkout**
- Steps: Have 100+ points → apply at checkout → place order
- Expected: Points deducted; discount reflected in order total

### TC-LOY-04 | P2 | Manual
**Referral — Share Link**
- Steps: Go to `/referral` while logged in
- Expected: Unique referral code/link shown; WhatsApp share button works

### TC-LOY-05 | P2 | Manual
**Referral — Reward on Friend's First Order**
- Steps: Friend uses referral code → places order
- Expected: Referrer gets loyalty credit; referee gets discount

---

## MODULE 10 — WISHLIST

### TC-WSH-01 | P2 | Manual
**Add to Wishlist**
- Steps: Click heart icon on product card (logged in)
- Expected: Item saved; heart icon fills/highlights

### TC-WSH-02 | P2 | Manual
**Wishlist Page**
- Steps: Go to `/wishlist`
- Expected: Saved products shown with image, name, price, Add to Cart option

### TC-WSH-03 | P2 | Manual
**Remove from Wishlist**
- Steps: Click heart again on saved product
- Expected: Removed from wishlist; page updates

### TC-WSH-04 | P2 | Manual
**Wishlist — Not Logged In**
- Steps: Click heart icon without logging in
- Expected: Redirect to `/login` or prompt to sign in

---

## MODULE 11 — INVENTORY MANAGEMENT

### TC-INV-01 | P1 | Manual
**Admin — Edit Stock Level**
- Steps: Admin → product → variant → update stock to 50 → Save
- Expected: Stock updated; reflected on product page

### TC-INV-02 | P2 | Manual
**Admin — Bulk Import via CSV**
- Steps: `/admin/inventory-import` → upload valid CSV with SKU, stock, price columns
- Expected: Stock levels updated for matched variants; import summary shown

### TC-INV-03 | P2 | Manual
**Admin — Invalid CSV Format**
- Steps: Upload CSV with missing required columns
- Expected: Error shown; no partial imports applied

### TC-INV-04 | P2 | Manual
**Low Stock Alert**
- Steps: Set reorder threshold to 10; reduce stock to 9
- Expected: Admin receives low stock alert email

### TC-INV-05 | P1 | Manual
**Stock Decrement on Order**
- Steps: Place order for 2 units of a product with 5 stock
- Expected: Stock reduces to 3 after order confirmed

---

## MODULE 12 — ADMIN DASHBOARD & ANALYTICS

### TC-ADM-01 | P1 | Manual
**Admin Dashboard KPIs**
- Steps: Login as admin → view `/admin`
- Expected: Total orders, revenue, low stock count, recent orders visible

### TC-ADM-02 | P2 | Manual
**Analytics Page**
- Steps: Go to `/admin/analytics`
- Expected: Charts render; top products, revenue trends, order counts visible

### TC-ADM-03 | P2 | Manual
**GST Report**
- Steps: `/admin/gst-report` → select month/year → Generate
- Expected: IGST/CGST/SGST breakdown by order; downloadable

### TC-ADM-04 | P1 | Manual
**Admin RBAC — Manager Role**
- Steps: Login as manager → try to access `/admin/users`
- Expected: Access denied; redirected based on role permissions

### TC-ADM-05 | P1 | Manual
**Admin RBAC — Inventory Staff**
- Steps: Login as inventory_staff → access product/inventory pages
- Expected: Inventory pages accessible; orders/analytics blocked

### TC-ADM-06 | P2 | Manual
**Admin — Manage Users**
- Steps: Admin → `/admin/users` → change a user's role to "manager"
- Expected: Role updated; user now has manager-level access

### TC-ADM-07 | P2 | Manual
**Admin — Customer List**
- Steps: Go to `/admin/customers`
- Expected: Customer segments shown (new, returning, at-risk); searchable list

---

## MODULE 13 — EMAIL & NOTIFICATIONS

### TC-EML-01 | P1 | Manual
**Order Confirmation Email — COD**
- Steps: Place COD order with valid email
- Expected: Confirmation email received with order summary, invoice PDF attached

### TC-EML-02 | P1 | Manual
**Order Confirmation Email — Online Payment**
- Steps: Complete Razorpay payment
- Expected: Confirmation email sent after payment verification

### TC-EML-03 | P1 | Manual
**Dispatch Email**
- Steps: Admin adds shipment info & saves
- Expected: Customer receives dispatch email with courier name, tracking number

### TC-EML-04 | P1 | Manual
**Delivery Email**
- Steps: Admin marks order as "delivered"
- Expected: Delivery email sent with 7-day return window reminder

### TC-EML-05 | P2 | Manual
**Contact Form — Admin Notification**
- Steps: Submit contact form
- Expected: Admin (`info@srilaya.com`) receives email with name, email, phone, message

### TC-EML-06 | P2 | Manual
**Contact Form — Customer Auto-reply**
- Steps: Submit contact form with customer email
- Expected: Customer receives acknowledgement email within seconds

### TC-EML-07 | P2 | Manual
**Password Reset Email**
- Steps: Admin requests password reset
- Expected: Email with reset link received; link works

### TC-EML-08 | P2 | Manual
**Brand Name in Emails**
- Steps: Trigger any transactional email
- Expected: All emails show "SriLaYa Naturals" (not "Enterprises")

### TC-EML-09 | P2 | Manual
**Failed Email Queue**
- Steps: Admin → `/admin/failed-emails`
- Expected: Failed emails listed; retry button works

---

## MODULE 14 — CONTACT & BLOG

### TC-CNT-01 | P1 | Manual
**Contact Form — Submission**
- Steps: Fill name, email, message → Submit Inquiry Form
- Expected: Success state shown ("Message Sent Successfully!"); form replaced by confirmation

### TC-CNT-02 | P1 | Manual
**Contact Form — Missing Required Fields**
- Steps: Submit with empty message field
- Expected: HTML5 validation blocks; error shown

### TC-CNT-03 | P2 | Manual
**Contact Page — Brand Details Correct**
- Steps: Visit `/contact`
- Expected: Phone shows `+91 86603 21315`; email shows `info@srilaya.com`

### TC-BLG-01 | P2 | Manual
**Blog Listing**
- Steps: Go to `/blog`
- Expected: Blog posts shown with title, category, excerpt, date; pagination works

### TC-BLG-02 | P2 | Manual
**Blog Post Page**
- Steps: Click any blog post
- Expected: Full article renders; title, content, category, date visible

### TC-BLG-03 | P2 | Manual
**Admin — Create Blog Post**
- Steps: Admin → `/admin/blog` → create new post with title, content, slug → Publish
- Expected: Post appears at `/blog/[slug]`

---

## MODULE 15 — LEGAL PAGES

### TC-LGL-01 | P2 | Manual
**Privacy Policy Page**
- Steps: Go to `/privacy`
- Expected: Page loads; all 10 sections visible; no `??` corruption; brand name "SriLaYa Naturals"

### TC-LGL-02 | P2 | Manual
**Terms of Service Page**
- Steps: Go to `/terms`
- Expected: Page loads; GSTIN shown; Bengaluru jurisdiction mentioned

### TC-LGL-03 | P2 | Manual
**Shipping Policy Page**
- Steps: Go to `/shipping-policy`
- Expected: Delivery timeline table visible; free shipping threshold (₹499) mentioned

### TC-LGL-04 | P2 | Manual
**Returns Policy Page**
- Steps: Go to `/returns-policy`
- Expected: 7-day return window prominent; refund methods table shown

### TC-LGL-05 | P2 | Manual
**Footer Legal Links**
- Steps: Scroll to footer on any page
- Expected: Privacy · Terms · Shipping · Returns links visible and navigating correctly

---

## MODULE 16 — ACCOUNT PAGE

### TC-ACC-01 | P1 | Manual
**Account — Authenticated View**
- Steps: Login → go to `/account`
- Expected: Profile card (email/phone, member since); order history; Change Password; Sign Out

### TC-ACC-02 | P1 | Manual
**Account — Order History**
- Steps: Have past orders → go to account
- Expected: Orders listed with status badge, total, date; Track / View Details links work

### TC-ACC-03 | P1 | Manual
**Account — Change Password**
- Steps: Expand Change Password → enter current + new password → Submit
- Expected: Password updated; success message; can login with new password

### TC-ACC-04 | P2 | Manual
**Account — Phone-only User (No Email)**
- Steps: Login via OTP → view account
- Expected: Email shown as "Not set"; phone shown; Change Password blocked (no password set)

### TC-ACC-05 | P2 | Manual
**Account — Guest Order Lookup**
- Steps: Visit `/account` without logging in → enter email used during guest checkout
- Expected: Orders for that email shown

---

## MODULE 17 — SEARCH & NAVIGATION

### TC-NAV-01 | P1 | Manual
**Header — Desktop Navigation**
- Steps: Open site on desktop (>1024px)
- Expected: Logo, primary nav, search bar, cart icon all visible; category strip shown below

### TC-NAV-02 | P1 | Manual
**Header — Mobile Hamburger Menu**
- Steps: Open site on mobile (<1024px)
- Expected: Hamburger icon visible; tap opens drawer with all nav links and search

### TC-NAV-03 | P1 | Manual
**Mobile Drawer — Close**
- Steps: Open drawer → tap backdrop or X button
- Expected: Drawer closes; page scrollable again

### TC-NAV-04 | P2 | Manual
**Search — Desktop**
- Steps: Type in header search bar → press Enter
- Expected: Redirected to `/search?q=[term]`; results shown

### TC-NAV-05 | P2 | Manual
**Search — Mobile**
- Steps: Open mobile drawer → use search field
- Expected: Search submits and drawer closes; results shown

### TC-NAV-06 | P1 | Manual
**Cart Badge Count**
- Steps: Add 3 items to cart
- Expected: Cart icon shows "3" badge; updates in real time

---

## MODULE 18 — MOBILE RESPONSIVENESS

### TC-MOB-01 | P1 | Manual
**Homepage — Mobile Layout**
- Steps: Open `/` on 375px viewport
- Expected: Hero CTA buttons stack vertically; USP strip 2-col with dividers; no horizontal overflow

### TC-MOB-02 | P1 | Manual
**Product Page — Mobile Layout**
- Steps: Open product page on mobile
- Expected: Gallery stacks above variant selector; Add to Cart button full-width; no text overflow

### TC-MOB-03 | P1 | Manual
**Checkout — Mobile Layout**
- Steps: Open `/checkout` on mobile
- Expected: Order summary appears FIRST (above form); all form fields full-width; courier options readable

### TC-MOB-04 | P1 | Manual
**Size Dropdown — Mobile**
- Steps: Open product page on real mobile device → tap size selector
- Expected: Dropdown arrow visible; native OS picker opens; selection updates price

### TC-MOB-05 | P2 | Manual
**Cart Page — Mobile**
- Steps: View cart on mobile
- Expected: Item rows stack cleanly; quantity controls usable with thumbs; total visible

### TC-MOB-06 | P2 | Manual
**Footer — Mobile**
- Steps: Scroll to footer on mobile
- Expected: 2-column grid on sm; legal links wrap cleanly; no text truncation

### TC-MOB-07 | P2 | Manual
**Legal Pages — Mobile**
- Steps: Open `/privacy` on mobile
- Expected: Shipping policy table scrolls horizontally; text readable at 16px+

---

## MODULE 19 — SEO & METADATA

### TC-SEO-01 | P2 | Manual
**Page Titles**
- Steps: Check browser tab title on homepage, product page, category page
- Expected: Format `[Page Title] | SriLaYa Naturals` on all pages

### TC-SEO-02 | P2 | Manual
**Sitemap**
- Steps: Visit `/sitemap.xml`
- Expected: XML sitemap returns; contains product, blog, category URLs

### TC-SEO-03 | P2 | Manual
**Robots.txt**
- Steps: Visit `/robots.txt`
- Expected: Valid robots.txt; admin routes disallowed

### TC-SEO-04 | P2 | Manual
**Open Graph Tags**
- Steps: Use Facebook/Twitter card debugger on product page URL
- Expected: OG title, description, image populated correctly

---

## MODULE 20 — ADMIN BLOG & CONTENT

### TC-ADM-BLG-01 | P2 | Manual
**Admin — Edit Blog Post**
- Steps: Admin → existing post → edit title/content → Save
- Expected: Changes reflected on public blog page

### TC-ADM-BLG-02 | P2 | Manual
**Admin — Delete Blog Post**
- Steps: Admin → delete a post
- Expected: Post removed; visiting old URL returns 404

### TC-ADM-REV-01 | P2 | Manual
**Admin — Approve Review**
- Steps: Admin → `/admin/reviews` → approve pending review
- Expected: Review appears on product page

### TC-ADM-REV-02 | P2 | Manual
**Admin — Reject Review**
- Steps: Reject a review
- Expected: Review hidden; customer's review remains submitted but not published

---

## REGRESSION CHECKLIST (Run after every major change)

| # | Check | Pass/Fail |
|---|-------|-----------|
| 1 | Homepage loads without errors | |
| 2 | Add to cart works on product page | |
| 3 | Cart count updates in header | |
| 4 | Checkout form submits (COD) | |
| 5 | Order confirmation page loads | |
| 6 | Admin login works | |
| 7 | Admin orders list loads | |
| 8 | No `??` corruption anywhere visible | |
| 9 | "SriLaYa Naturals" shown (not "Enterprises") everywhere | |
| 10 | Mobile hamburger menu opens/closes | |
| 11 | Footer legal links navigate correctly | |
| 12 | Contact form submits successfully | |

---

## TEST ENVIRONMENT NOTES

- **Test Razorpay card:** 4111 1111 1111 1111 | Expiry: any future | CVV: any 3 digits
- **Test Razorpay UPI:** success@razorpay
- **OTP in dev mode:** Check server console (`console.log`) — no real SMS sent
- **Email in dev mode:** Set `RESEND_API_KEY` in `.env` to receive real emails; without it emails are silently skipped
- **Admin test account:** Must be seeded manually in DB with `role: "admin"`
- **Mobile testing:** Use Chrome DevTools (Ctrl+Shift+M) for quick checks; use real device at `http://[local-ip]:3000` for accurate touch testing
