SriLaYa Foods — Feature Backlog & Known Gaps
Last updated: 15 Jul 2026

## Pre-Launch Blockers (must fix before going live)

1. **Bank/UPI account details** on `/payments` page — currently "TO BE UPDATED" placeholder
2. **support@srilayamillets.com** email address — needs confirmation before going live
3. **Razorpay live keys** — currently on test keys (`rzp_test_*`); switch to live before launch
4. **Custom email domain** — Resend currently restricted to the signup email; add domain + update `EMAIL_FROM`
5. **BRAND_GSTIN** — not set; required for GST invoices to be legally valid

## Nice-to-Have / Future Features

6. **Broken Unsplash stock photos** — a few seeded products have expired image URLs; replace with real product photography
7. **Loyalty points display on account page** — LOY-01b test skipped; loyalty points balance not shown on `/account`
8. **OTP login in test environment** — AUTH-08 Playwright test skipped because no SMS provider is wired in the dev env
9. **Razorpay webhook** — webhook URL not registered yet; payment.failed events not handled in production
10. **WhatsApp Business number** — currently using Twilio sandbox (`+14155238886`); apply for approved number before customers can receive WA messages without joining sandbox

## Completed (archived)

- ✅ Auto-generate SKU when adding a new product variant
- ✅ Clear Add Variant form after submit
- ✅ Per-variant reorder thresholds
- ✅ Role-based access control (owner / admin / manager / inventory_staff / billing_staff)
- ✅ Offline in-store sales UI with invoice
- ✅ Order detail page (/admin/orders/[id])
- ✅ P&L report (owner-only)
- ✅ Cost price hidden from non-owner roles
- ✅ Raw material low-stock alerts on dashboard
- ✅ Production material cost in P&L
- ✅ Full Playwright E2E test suite (169/175 passing)
