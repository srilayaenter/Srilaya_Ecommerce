# SriLaYa Foods — Setup & Configuration Reference

## Environment Variables

### Local (`.env` in project root)

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_T51XLx2B6sua4V"
RAZORPAY_KEY_SECRET="cF7KEpdVHqnzfodPmNC4kS9O"
RAZORPAY_WEBHOOK_SECRET=""        # set after configuring webhook in Razorpay dashboard

# NextAuth
NEXTAUTH_SECRET="T7b+xR2yP9qW4vM1nC6kF8jD3hG5sL0pZtB2cV4mN8A="
NEXTAUTH_URL="http://localhost:3000"            # change to production URL on Vercel
NEXT_PUBLIC_APP_URL="http://localhost:3000"     # change to production URL on Vercel

# Email (Resend)
RESEND_API_KEY="re_3246PYiC_ysGx2bkFMTGHk1gDr6sGb4w3"
EMAIL_FROM="onboarding@resend.dev"              # change to orders@yourdomain.com after domain setup
ADMIN_ALERT_EMAIL="avrsrikanth@gmail.com"

# WhatsApp (Twilio) — optional, silently skipped if not set
TWILIO_ACCOUNT_SID=""                           # from console.twilio.com
TWILIO_AUTH_TOKEN=""                            # from console.twilio.com
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"    # Twilio sandbox default; use your approved number in prod

# Cron
CRON_SECRET="e32d49eee629310ffe455b3d440e07cc1deaa3c3bff8e8b172c52253bd570cec"

# Brand
BRAND_GSTIN=""                                  # fill in your GST number
```

---

## Vercel Dashboard

**URL:** https://vercel.com → your project → Settings → Environment Variables

Add these (select Production + Preview + Development for each):

| Key | Value | Status |
|-----|-------|--------|
| `RESEND_API_KEY` | `re_3246PYiC_ysGx2bkFMTGHk1gDr6sGb4w3` | ✅ Add |
| `ADMIN_ALERT_EMAIL` | `avrsrikanth@gmail.com` | ✅ Add |
| `CRON_SECRET` | `e32d49eee629310ffe455b3d440e07cc1deaa3c3bff8e8b172c52253bd570cec` | ✅ Add |
| `NEXTAUTH_URL` | `https://your-vercel-url.vercel.app` | ✅ Update |
| `NEXT_PUBLIC_APP_URL` | `https://your-vercel-url.vercel.app` | ✅ Update |
| `BRAND_GSTIN` | `29AYOPD6369H1ZV` | ✅ Add |
| `RAZORPAY_WEBHOOK_SECRET` | from Razorpay dashboard | ⏳ When ready |

After adding vars → Deployments tab → three dots on latest → **Redeploy**.

---

## Resend (Email)

**URL:** https://resend.com

| Item | Detail |
|------|--------|
| Account email | avrsrikanth@gmail.com |
| API Key | `re_3246PYiC_ysGx2bkFMTGHk1gDr6sGb4w3` |
| Current sender | `onboarding@resend.dev` (free shared domain) |
| Free plan restriction | Can only deliver to the Resend signup email. Buy a domain to send to customers. |

### To add a custom domain later
1. Resend dashboard → Domains → Add Domain
2. Enter your domain (e.g. `srilayafoods.in`)
3. Add the DNS records (MX, TXT, DKIM) in your domain registrar
4. Click Verify
5. Update `EMAIL_FROM` to `orders@srilayafoods.in` in both `.env` and Vercel

---

## Supabase (Database)

**URL:** https://supabase.com → project `szsrdtiphbdpdfggxwpw`

| Item | Detail |
|------|--------|
| Region | ap-south-1 (Mumbai) |
| Connection string | In `.env` as `DATABASE_URL` and `DIRECT_URL` |
| Migrations | Run `npx prisma migrate dev` locally; Vercel build runs `prisma migrate deploy` |

---

## Razorpay

**URL:** https://dashboard.razorpay.com

| Item | Detail |
|------|--------|
| Mode | Test (`rzp_test_*`) — switch to live keys before launch |
| Key ID | `rzp_test_T51XLx2B6sua4V` |
| Key Secret | `cF7KEpdVHqnzfodPmNC4kS9O` |
| Webhook | Settings → Webhooks → Add URL: `https://your-domain/api/payments/razorpay/webhook` |
| Webhook events | `payment.captured`, `payment.failed` |
| Webhook secret | Copy and set as `RAZORPAY_WEBHOOK_SECRET` in `.env` and Vercel |

### Switching to live keys
1. Razorpay dashboard → switch to Live mode
2. Generate live Key ID + Secret
3. Replace `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel env vars
4. Re-add webhook with live URL
5. Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` if used on frontend

---

## Vercel Cron Jobs

**File:** `apps/web/vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/low-stock",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Runs daily at 9:00 AM UTC. Requires `CRON_SECRET` to be set in Vercel env vars.

---

## Admin Accounts

Default admin is seeded via Prisma seed or created manually in the database.

To create a new admin via the admin UI:
- Admin → Users → Create Staff Account

Roles available: `admin`, `manager`, `inventory_staff`, `billing_staff`

Password reset flow: `/admin/forgot-password` → email link → `/admin/reset-password?token=`

---

## Pre-Launch Checklist

- [x] Set `RESEND_API_KEY` in Vercel
- [x] Set `ADMIN_ALERT_EMAIL` in Vercel
- [x] Set `CRON_SECRET` in Vercel
- [x] Fill in `BRAND_GSTIN` — `29AYOPD6369H1ZV`
- [ ] Set `NEXTAUTH_URL` to production URL in Vercel
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL in Vercel
- [ ] Configure Razorpay webhook + set `RAZORPAY_WEBHOOK_SECRET`
- [ ] Switch Razorpay to live keys
- [ ] Buy a domain and verify with Resend (update `EMAIL_FROM`)
- [ ] Update `payments` page bank account details
- [ ] Test order confirmation email end-to-end
- [ ] Test password reset email
