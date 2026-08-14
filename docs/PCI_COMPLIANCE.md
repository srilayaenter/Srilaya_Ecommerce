# PCI-DSS Compliance — SriLaYa Naturals

**Last reviewed:** 2026-07-23  
**Compliance level:** SAQ-A (outsourced card processing via Razorpay)  
**Merchant category:** Level 4 (low-volume e-commerce, India)

---

## 1. Merchant Classification

SriLaYa Naturals uses **Razorpay** as the sole payment processor. Card data is entered directly into Razorpay's hosted checkout — it never passes through, is never processed by, and is never stored on SriLaYa's servers. This qualifies SriLaYa for **SAQ-A** (the lightest self-assessment questionnaire under PCI-DSS v4.0).

---

## 2. Payment Data Flow

```
Customer browser
      │
      │  1. Customer selects products, proceeds to checkout
      │
      ▼
SriLaYa server  (/api/payments/razorpay/order)
      │
      │  2. Server creates Razorpay order (amount from DB — never from client)
      │     Returns: { orderId, key, amount }  — NO card data
      │
      ▼
Razorpay hosted checkout  (razorpay.com iframe)
      │
      │  3. Customer enters card/UPI/netbanking details
      │     Card data stays inside Razorpay's PCI-certified environment
      │     3DS challenge triggered by Razorpay per RBI mandate
      │
      ▼
Razorpay servers
      │
      │  4. Payment captured; Razorpay sends webhook to:
      │     /api/payments/razorpay/webhook
      │
      ▼
SriLaYa server
      │
      │  5. Webhook signature verified (HMAC-SHA256)
      │     Order status updated: pending → paid
      │     Confirmation email sent to customer
      │
      ▼
Admin panel  (Razorpay Dashboard for refunds/settlements)
```

**SriLaYa never sees:** card numbers, CVV, expiry dates, bank account numbers.  
**SriLaYa stores:** Razorpay Order ID (opaque), Razorpay Payment ID (opaque), amount, timestamp, customer email/phone.

---

## 3. SAQ-A Compliance Checklist

| Requirement | Status | Notes |
|---|---|---|
| **2.1** No cardholder data on SriLaYa servers | ✅ | Razorpay hosted checkout — card data never reaches us |
| **2.2** HTTPS / TLS 1.2+ on all pages | ✅ | Vercel enforces TLS; HSTS header set |
| **6.1** Secure software development | ✅ | CodeQL SAST on every push; dependency updates via Dependabot |
| **6.2** Protect web-facing applications | ✅ | CSP configured to allow only razorpay.com scripts |
| **8.1** Unique IDs for all admin users | ✅ | 7 named staff slots; no shared credentials |
| **8.2** Strong passwords for admin | ⬜ | Passwords must be reset before go-live |
| **9.1** Physical access controls | N/A | No on-premise servers; Vercel + Supabase cloud |
| **10.1** Audit logging of payment events | ⬜ | PaymentAuditLog table planned (GitHub issue #36) |
| **10.2** 90-day log retention | ⬜ | Retention cleanup job planned (GitHub issue #36) |
| **10.3** Log access controls | ⬜ | Admin-only route; to be implemented with issue #36 |
| **11.1** Quarterly vulnerability scans | ⬜ | Annual penetration test scheduled (issue #46) |
| **12.1** Incident response plan | ✅ | See Section 5 below |
| **12.2** Annual PCI review | ⬜ | Due: 2027-07 |

---

## 4. What We Store vs. What We Don't

### Stored (allowed under SAQ-A)

| Field | Where | Why |
|---|---|---|
| `razorpayOrderId` | `Order.paymentId` | Links webhook events to orders |
| `razorpayPaymentId` | `Order.paymentId` (updated post-capture) | Refund reference |
| `amount` | `Order.total` | Order fulfillment |
| `status` | `Order.status` | Fulfillment + support |
| Customer email/phone | `Order.email`, `Order.phone` | Shipping, receipts |

### Never stored

- Card number (PAN)
- CVV / CVC
- Card expiry date
- Bank account / IFSC
- UPI PIN

---

## 5. Incident Response

### 5.1 Suspicious transaction detected

1. Admin receives alert from PaymentAuditLog anomaly or customer report.
2. Log the incident in writing (date, order ID, amount, description).
3. Contact Razorpay support: [razorpay.com/support](https://razorpay.com/support).
4. If fraud confirmed: initiate refund via Razorpay Dashboard.
5. Notify affected customer within **72 hours** by email.
6. Document outcome and close the incident log entry.

### 5.2 Webhook secret or API key compromised

1. Immediately rotate in Razorpay Dashboard → API Keys.
2. Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in Vercel environment variables (production and staging).
3. Redeploy.
4. Review `FailedWebhook` table for any events during the window of compromise.
5. If any payment data was accessed: notify Razorpay's security team.

### 5.3 Data breach (SriLaYa database)

1. Immediately revoke all admin sessions (rotate `NEXTAUTH_SECRET`).
2. Rotate Supabase DB password and update `DATABASE_URL` in Vercel.
3. Assess what was accessed: orders contain names, emails, addresses — **not card data**.
4. Notify affected users by email within **72 hours**.
5. If breach affects payment flow: notify Razorpay and NPCI (RBI helpline: 1800-180-1111).
6. File report per IT Act 2000 Section 43A if personally identifiable data was exposed.

---

## 6. Security Controls in Place

### Payment endpoint protection

- `/api/payments/razorpay/order` — rate limited: 5 requests/min/IP
- `/api/payments/razorpay/webhook` — HMAC-SHA256 signature verified on every request
- Webhook de-duplication via `WebhookEvent` table (idempotent processing)
- Failed webhook capture in `FailedWebhook` table with admin retry UI

### Admin access

- All admin routes require authenticated session + role check (`isAdminRole`)
- Heavy admin routes (bulk pricing, imports, uploads) additionally rate-limited
- Two-factor authentication available (TOTP) for owner accounts

### Infrastructure

- All secrets stored in Vercel environment variables — never in source code
- CodeQL SAST scan runs on every push to staging/main and weekly
- `.env` is in `.gitignore`; never committed

---

## 7. Open Items Before Go-Live

The following are required before the production launch:

1. **Enable 3DS in Razorpay Dashboard** (Settings → Security → 3D Secure). Mandatory per RBI for ₹2000+ transactions. *(Manual step — no code required.)*
2. **Reset all 7 staff slot passwords** after shared-access period.
3. **Implement PaymentAuditLog** (GitHub issue [#36](https://github.com/avrsrikanth/srilaya-ecommerce/issues/36)) — required for PCI-DSS requirement 10.
4. **Submit SAQ-A** to Razorpay after completing audit logging. Download from: Razorpay Dashboard → Business Docs → PCI-DSS.

---

## 8. Razorpay as Sub-Processor

Razorpay is a PCI-DSS Level 1 certified payment gateway (the highest certification). Their compliance documentation is available at [razorpay.com/compliance](https://razorpay.com/compliance). As a Level 1 processor, Razorpay undergoes annual on-site audits by a Qualified Security Assessor (QSA).

SriLaYa's merchant agreement with Razorpay includes their data processing terms. Under SAQ-A, SriLaYa's compliance responsibility is limited to:

- The checkout page being served over HTTPS
- Not storing cardholder data
- Maintaining access controls for admin systems
- Having an incident response plan

---

## 9. Annual Review Schedule

| Activity | Due | Owner |
|---|---|---|
| Review this document | 2027-07-01 | Tech lead |
| Re-submit SAQ-A | 2027-07-01 | Business owner |
| Rotate API keys | 2027-01-01 | Tech lead |
| Penetration test | 2027-07-01 | External firm (issue #46) |
| Staff password audit | 2027-01-01 | Admin |

---

## 10. References

- [PCI-DSS v4.0 SAQ-A](https://www.pcisecuritystandards.org/document_library/)
- [Razorpay PCI Compliance](https://razorpay.com/compliance/)
- [RBI Payment System Guidelines](https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=11278)
- [CERT-In Incident Reporting](https://www.cert-in.org.in/)
- Internal: `PAYMENT_SECURITY_AUDIT.md`, `PAYMENT_SECURITY_CHECKLIST.md`
