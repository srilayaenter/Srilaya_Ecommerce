# Staging Environment Setup

One-time runbook for standing up the `staging` branch → Vercel preview → Supabase staging pipeline.
After this is done, the CI workflow handles everything automatically.

---

## Architecture overview

```
developer push
     │
     ▼
 staging branch  ──► Vercel Preview deployment  ──► Supabase staging DB
     │                        │                       (free-tier project)
     │                        │ X-Robots-Tag: noindex
     │                        ▼
     │              GitHub Action: staging-smoke.yml
     │                  runs smoke.spec.ts against
     │                  the Vercel preview URL
     │
     ▼ (PR to main)
 branch protection rule
   requires "smoke / smoke-test" ✅
     │
     ▼
   main  ──► Vercel Production deployment ──► Supabase production DB
```

Razorpay test keys are used in staging — no real money moves.

---

## Step 1 — Create the staging branch

```bash
git checkout main
git pull
git checkout -b staging
git push -u origin staging
```

---

## Step 2 — Create the Supabase staging project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name: `srilaya-staging` · Region: **ap-south-1 (Mumbai)**
3. Generate a strong DB password and save it in 1Password / your password manager
4. Wait for project to provision (~2 min)
5. **Project Settings → Database → Connection string → URI** — copy both:
   - **Pooler URL** (port 6543) → `DATABASE_URL`
   - **Direct URL** (port 5432) → `DIRECT_URL`

### Apply migrations to the staging database

```bash
# From repo root — uses DIRECT_URL for migrations
DIRECT_URL="postgresql://..." \
DATABASE_URL="postgresql://..." \
pnpm prisma migrate deploy --schema=packages/db/schema.prisma
```

### Seed staging data

```bash
DATABASE_URL="postgresql://..." pnpm seed
```

This creates a basic product catalog so smoke tests have data to query.

---

## Step 3 — Get Razorpay test keys

1. Log in to [razorpay.com](https://razorpay.com)
2. Toggle to **Test Mode** (top-right switch)
3. **Settings → API Keys → Generate Test Key**
4. Copy `Key ID` (starts with `rzp_test_`) and `Key Secret`
5. **Webhooks → Add New Webhook**:
   - URL: `https://<staging-vercel-url>/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`, `refund.created`
   - Copy the webhook secret

Test card for checkout: **4111 1111 1111 1111**, any future expiry, any CVV.

---

## Step 4 — Configure Vercel

### 4a — Create a "Preview (staging branch)" environment

Vercel auto-creates preview deployments for every branch, but you need to pin
staging-specific env vars to the `staging` branch so they don't bleed into
other preview deployments.

1. **Vercel Dashboard → Project → Settings → Environment Variables**
2. For each variable in `.env.staging.example`:
   - Click **Add New**
   - Scope: **Preview** → tick **Apply to specific branches** → type `staging`
   - Paste the staging value

Key differences from production:

| Variable | Production | Staging |
|---|---|---|
| `DATABASE_URL` | Production Supabase pooler | Staging Supabase pooler |
| `RAZORPAY_KEY_ID` | `rzp_live_…` | `rzp_test_…` |
| `RAZORPAY_KEY_SECRET` | live secret | test secret |
| `NEXTAUTH_URL` | `https://srilayafoods.com` | Vercel stable branch alias (see below) |
| `VERCEL_ENV` | set automatically to `production` | set automatically to `preview` |

### 4b — Find the stable staging alias

After the first push to `staging` triggers a deployment:

1. **Vercel → Deployments → filter by Branch: staging**
2. Click the deployment → copy the **Branch alias URL**
   - It looks like: `https://srilaya-ecommerce-git-staging-<team>.vercel.app`
3. Set this as `NEXTAUTH_URL` in the staging env vars

### 4c — Add the staging URL to Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → Credentials → your OAuth client
2. **Authorised redirect URIs → Add URI**:
   `https://srilaya-ecommerce-git-staging-<team>.vercel.app/api/auth/callback/google`

---

## Step 5 — Enable branch protection on main

**GitHub → repo → Settings → Branches → Add branch protection rule**

| Setting | Value |
|---|---|
| Branch name pattern | `main` |
| Require status checks before merging | ✅ |
| Status check name | `smoke / smoke-test` |
| Require branches to be up to date | ✅ |
| Restrict who can push to matching branches | owners / admins only |
| Do not allow bypassing the above settings | ✅ |

After the first smoke run completes, `smoke / smoke-test` will appear in the
status check dropdown for you to select.

---

## Step 6 — Verify the pipeline end-to-end

```bash
# 1. Make a trivial change on staging
git checkout staging
echo "# test" >> README.md
git add README.md && git commit -m "chore: trigger staging smoke run"
git push

# 2. Watch the GitHub Actions run
#    https://github.com/<owner>/srilaya-ecommerce/actions
#    → "Staging smoke" workflow should appear within 30 seconds

# 3. Open a PR: staging → main
#    The PR should show "smoke / smoke-test" as a required check
#    It must pass before the Merge button becomes available
```

---

## Day-to-day workflow

```
feature branch → PR to staging → merge → Vercel preview auto-deploys
                                        → smoke CI runs automatically
                                        → if green, open PR: staging → main
                                        → branch protection requires smoke ✅
                                        → merge → production deploy
```

---

## Troubleshooting

**Smoke tests time out waiting for Vercel URL**
- Check that the Vercel GitHub app has permission to create deployments
  (`github.com/<repo> → Settings → Integrations → Vercel`)
- The poller waits up to 6 minutes. Vercel builds typically take 2–3 min.

**`SMOKE-01 health endpoint` fails with 500**
- The staging DB migrations may not have run. Run Step 2 migrations again.
- Check Vercel build logs for `prisma generate` errors.

**Auth tests pass locally but fail in staging**
- Verify `NEXTAUTH_URL` in Vercel matches the actual branch alias URL exactly
  (no trailing slash).

**Razorpay webhook signature mismatch**
- `RAZORPAY_WEBHOOK_SECRET` in Vercel must match the secret from the test-mode
  webhook registered in Step 3.

**`X-Robots-Tag: noindex` not appearing**
- `VERCEL_ENV` is set automatically by Vercel; it is `"preview"` for the staging
  deployment and `"production"` for the main deployment. Do not override it.
- Verify with: `curl -I <staging-url>/` and check response headers.
