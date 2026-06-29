# SriLaYa Enterprises — Setup & Configuration Reference

## Environment Variables

### Local (`.env` in project root)

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_xxxx"                  # switch to live key before launch
RAZORPAY_KEY_SECRET="xxxx"                        # switch to live secret before launch
RAZORPAY_WEBHOOK_SECRET=""                        # set after configuring webhook in Razorpay dashboard

# NextAuth
NEXTAUTH_SECRET="<random 32+ byte base64 string>"
NEXTAUTH_URL="http://localhost:3000"              # change to production URL on Vercel
NEXT_PUBLIC_APP_URL="http://localhost:3000"       # change to production URL on Vercel

# Email (Resend)
RESEND_API_KEY="re_xxxx"
EMAIL_FROM="onboarding@resend.dev"               # change to orders@yourdomain.com after domain setup
ADMIN_ALERT_EMAIL="avrsrikanth@gmail.com"

# WhatsApp (Twilio) — optional, silently skipped if not set
TWILIO_ACCOUNT_SID=""                            # from console.twilio.com
TWILIO_AUTH_TOKEN=""                             # from console.twilio.com
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"     # Twilio sandbox default; use your approved number in prod

# Cron — protects all /api/cron/* routes
CRON_SECRET="<random secret, generate with: openssl rand -hex 32>"

# Brand
BRAND_GSTIN=""                                   # fill in your GST number
```

> **Security note:** Never commit `.env` to git. Verify `.gitignore` includes `.env` before every push.
> Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
> Generate `CRON_SECRET` with: `openssl rand -hex 32`

---

## Vercel Dashboard

**URL:** https://vercel.com → your project → Settings → Environment Variables

Add these (select Production + Preview + Development for each):

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Supabase pooler URL | Production connection |
| `DIRECT_URL` | Supabase direct URL | Used by Prisma migrations |
| `NEXTAUTH_SECRET` | Random 32-byte base64 | Must match local `.env` |
| `NEXTAUTH_URL` | `https://your-vercel-url.vercel.app` | Update to custom domain when ready |
| `NEXT_PUBLIC_APP_URL` | `https://your-vercel-url.vercel.app` | Same as above |
| `RESEND_API_KEY` | From Resend dashboard | |
| `EMAIL_FROM` | `orders@yourdomain.com` | After domain verified in Resend |
| `ADMIN_ALERT_EMAIL` | `avrsrikanth@gmail.com` | Receives low-stock / return alerts |
| `RAZORPAY_KEY_ID` | Live key from Razorpay | `rzp_live_*` in production |
| `RAZORPAY_KEY_SECRET` | Live secret from Razorpay | |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay webhook config | Set after webhook is registered |
| `CRON_SECRET` | Random hex string | Must match local `.env` |
| `BRAND_GSTIN` | Your GST number | Printed on invoices |
| `TWILIO_ACCOUNT_SID` | From Twilio console | Optional — WhatsApp notifications |
| `TWILIO_AUTH_TOKEN` | From Twilio console | Optional |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | Use approved number in prod |

After adding vars → Deployments tab → three dots on latest → **Redeploy**.

---

## Resend (Email)

**URL:** https://resend.com

| Item | Detail |
|------|--------|
| Account email | avrsrikanth@gmail.com |
| Current sender | `onboarding@resend.dev` (free shared domain) |
| Free plan restriction | Can only deliver to the Resend signup email. Buy a domain to send to customers. |

### To add a custom domain
1. Resend dashboard → Domains → Add Domain
2. Enter your domain (e.g. `srilayaenterprises.in`)
3. Add the DNS records (MX, TXT, DKIM) in your domain registrar
4. Click Verify
5. Update `EMAIL_FROM` to `orders@srilayaenterprises.in` in both `.env` and Vercel

---

## Supabase (Database)

**URL:** https://supabase.com → project dashboard

| Item | Detail |
|------|--------|
| Region | ap-south-1 (Mumbai) |
| Connection string | In `.env` as `DATABASE_URL` (pooler) and `DIRECT_URL` (direct) |
| Migrations | Run `npx prisma migrate dev` locally; Vercel build runs `prisma migrate deploy` |

### Running migrations locally
```bash
# Stop the dev server first (Prisma DLL lock on Windows)
npx prisma migrate dev --name <description>
npx prisma generate
```

---

## Razorpay

**URL:** https://dashboard.razorpay.com

| Item | Detail |
|------|--------|
| Mode | Test (`rzp_test_*`) — switch to live keys before launch |
| Webhook URL | `https://your-domain/api/payments/razorpay/webhook` |
| Webhook events | `payment.captured`, `payment.failed` |
| Webhook secret | Copy and set as `RAZORPAY_WEBHOOK_SECRET` in `.env` and Vercel |

### Switching to live keys
1. Razorpay dashboard → switch to Live mode
2. Generate live Key ID + Secret
3. Replace `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel env vars
4. Re-add webhook with the live domain URL
5. Copy new webhook secret → update `RAZORPAY_WEBHOOK_SECRET`

---

## Twilio (WhatsApp Notifications) — Optional

**URL:** https://console.twilio.com

WhatsApp messages are sent for order confirmation and dispatch. The integration silently skips if `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` are not set.

| Item | Detail |
|------|--------|
| Sandbox number | `+14155238886` (testing only) |
| Sandbox activation | Customer must send "join <keyword>" to the sandbox number first |
| Production | Apply for a WhatsApp Business number in Twilio console |

---

## Vercel Cron Jobs

**File:** `vercel.json`

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/release-stock` | Every 15 min | Release reserved stock from unpaid orders |
| `/api/cron/low-stock-check` | Daily 09:00 UTC | Email admin when stock falls below threshold |
| `/api/cron/abandoned-cart` | Every hour | Send recovery email for carts idle > 2 hours |
| `/api/cron/cleanup-failed-emails` | Daily 02:00 UTC | Purge `FailedEmail` records older than 30 days |

All cron routes require `Authorization: Bearer <CRON_SECRET>` header. Vercel sets this automatically — ensure `CRON_SECRET` is set in Vercel env vars.

---

## Admin Accounts & Roles

Create admin accounts via the Admin UI: **Admin → Users → Create Staff Account**

| Role | Access |
|------|--------|
| `admin` | Full access — all pages including settings and user management |
| `manager` | Orders, products, categories, analytics, returns, coupons, bundles |
| `inventory_staff` | Products, categories, suppliers only |
| `billing_staff` | Orders only |

### MFA (Two-Factor Authentication)
All admin users can enable TOTP-based MFA from **Admin → MFA Setup**.
- Uses an authenticator app (Google Authenticator, Authy, etc.)
- TOTP secrets are encrypted at rest (AES-256-CBC)
- 5 failed attempts triggers a 15-minute lockout per user

### Password Reset
Flow: `/admin/forgot-password` → email link → `/admin/reset-password?token=`
- Reset tokens are SHA-256 hashed before storage — DB breach cannot be used to reset passwords
- Tokens expire in 1 hour
- Rate limited to 3 requests per 15 minutes per IP

---

## Security Notes

| Area | Implementation |
|------|---------------|
| Passwords | bcrypt (cost 12) |
| TOTP secrets | AES-256-CBC encrypted, keyed from `NEXTAUTH_SECRET` |
| Password reset tokens | SHA-256 hashed before DB storage |
| Payment amount | Always read from DB — client-supplied amount is ignored |
| Payment verification | `razorpay_order_id` validated against stored `paymentId` to prevent cross-order attacks |
| Order tracking | Exact phone/email match required; rate limited 10 req / 10 min per IP |
| MFA brute-force | 5 attempts / 15 min per user |
| Forgot password | 3 requests / 15 min per IP |
| Admin routes | Protected by NextAuth middleware + role-based path guards |
| Input validation | Zod schemas on all public-facing API routes |
| FailedEmail PII | Auto-purged after 30 days via daily cron |

---

## Pre-Launch Checklist

### Credentials
- [ ] Rotate `NEXTAUTH_SECRET` — generate fresh: `openssl rand -base64 32`
- [ ] Rotate Razorpay keys — switch to **Live** mode and generate new key pair
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` after registering webhook
- [ ] Set `CRON_SECRET` in Vercel env vars
- [ ] Verify `.env` is in `.gitignore` and not tracked by git

### Configuration
- [ ] Set `NEXTAUTH_URL` to production domain in Vercel
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain in Vercel
- [ ] Set `BRAND_GSTIN` (printed on GST invoices)
- [ ] Update `ADMIN_ALERT_EMAIL` if needed

### Email
- [ ] Buy a domain and verify with Resend
- [ ] Update `EMAIL_FROM` to `orders@yourdomain.com`
- [ ] Test order confirmation email end-to-end
- [ ] Test password reset email

### Payments
- [ ] Test full payment flow in Razorpay test mode
- [ ] Configure Razorpay webhook (live URL + events)
- [ ] Switch to live Razorpay keys
- [ ] Test live payment with a small amount

### Final
- [ ] Update bank/UPI details on the `/payments` page
- [ ] Create at least one admin account and test MFA setup
- [ ] Run `npx prisma migrate deploy` on production DB
- [ ] Verify all cron jobs appear in Vercel dashboard under Settings → Cron Jobs
