# Payment Security Audit & Implementation Plan

**Last Updated:** 2026-07-23  
**Status:** 🟡 NEEDS CRITICAL FIXES BEFORE PRODUCTION  
**Overall Security Score:** 5.6/10 → Target: 9/10

---

## Executive Summary

Your payment system uses **Razorpay** with solid foundational security but has **critical compliance gaps** that must be fixed before production launch:

### ✅ Strengths
- Server-side amount validation (prevents price tampering)
- HMAC-SHA256 webhook signature verification
- Idempotency guards (webhook de-duplication)
- Payment order ID matching (prevents substitution attacks)
- Transactional stock restoration on failure

### 🔴 Critical Issues (Block Production)
1. **No 3DS (3D Secure)** — RBI mandate for India, ₹0+ card transactions
2. **No Audit Logging** — PCI-DSS requirement for regulatory compliance
3. **No Refund Endpoint** — Customer service blocker
4. **No Webhook Async** — Risk of duplicate charges on timeout
5. **No PCI-DSS Documentation** — Regulatory requirement

---

## Security Scoring Breakdown

### Current State (Before Fixes): 5.6/10

| Category | Current | Target | Status | Impact | Deadline |
|----------|---------|--------|--------|--------|----------|
| **Amount Validation** | 10/10 | 10/10 | ✅ | None | — |
| **Signature Verification** | 10/10 | 10/10 | ✅ | None | — |
| **Idempotency** | 9/10 | 10/10 | ✅ Good | Minor | Post-Launch |
| **Order Matching** | 10/10 | 10/10 | ✅ | None | — |
| **Stock Atomicity** | 10/10 | 10/10 | ✅ | None | — |
| **3DS Authentication** | 0/10 | 10/10 | 🔴 CRITICAL | High: RBI non-compliance | **BEFORE GO-LIVE** |
| **Audit Logging** | 2/10 | 10/10 | 🔴 CRITICAL | High: No PCI audit trail | **BEFORE GO-LIVE** |
| **PCI-DSS Compliance** | 3/10 | 10/10 | 🔴 CRITICAL | Critical: Regulatory | **BEFORE GO-LIVE** |
| **Webhook Async** | 4/10 | 9/10 | 🟡 HIGH | Medium: Timeout risk | Month 1 |
| **Rate Limiting** | 5/10 | 9/10 | 🟡 HIGH | Medium: Spam exposure | Month 1 |
| **Webhook Security (IP)** | 6/10 | 9/10 | 🟡 MEDIUM | Medium: No IP whitelist | Month 1 |
| **Refund Handling** | 0/10 | 9/10 | 🔴 MISSING | High: Support blocker | Month 1 |
| **Double-Payment Lock** | 6/10 | 9/10 | 🟡 MEDIUM | Low: Rare edge case | Month 2 |
| **Fraud Detection** | 2/10 | 8/10 | 🟡 MEDIUM | Medium: Velocity abuse | Month 2 |
| **HSTS/TLS** | 10/10 | 10/10 | ✅ | None | — |
| **OVERALL** | **5.6/10** | **9.2/10** | 🟡 **Production-Ready: NO** | — | — |

---

## Risk Assessment: Going Live Without Fixes

| Risk | Probability | Impact | Consequence |
|------|-------------|--------|-------------|
| **RBI audit failure** | **HIGH** | **CRITICAL** | Store operational license suspended |
| **Data breach / no audit trail** | **MEDIUM** | **CRITICAL** | Legal liability, ₹10L+ fine (PCI-DSS violation) |
| **Webhook timeout → duplicate charges** | **MEDIUM** | **HIGH** | Customer refund requests, reputation damage |
| **Payment fraud via velocity abuse** | **LOW** | **MEDIUM** | Chargebacks, payment processor blocking account |
| **No refund path** | **HIGH** | **MEDIUM** | Customer support nightmare, chargeback surge |

---

## Implementation Timeline

### Phase 1: CRITICAL (Do Before Go-Live) — 3-5 days
**Effort:** 14-20 hours | **Team:** 1 Backend Eng + DevOps + Compliance Officer

✅ **Must complete these to launch:**
1. Enable 3DS Authentication in Razorpay (4 hours)
2. Implement Audit Logging (6-8 hours)
3. Create PCI-DSS Compliance Documentation (4-6 hours)
4. Test all fixes with Razorpay test account

### Phase 2: HIGH-PRIORITY (Do in Month 1) — 2-3 days
**Effort:** 12-17 hours

5. Webhook Async Processing (4-6 hours)
6. Payment Endpoint Rate Limiting (2-3 hours)
7. Refund Endpoint (Admin-only) (4-6 hours)
8. Webhook IP Whitelist (2 hours)

### Phase 3: MEDIUM-PRIORITY (Do in Month 2) — 1-2 days
**Effort:** 11-16 hours

9. Double-Payment Prevention (3-4 hours)
10. Velocity Fraud Checks (4-6 hours)
11. Settlement Reconciliation (4-6 hours)

---

## What's Working Well ✅

### 1. Server-Side Amount Validation
```typescript
// ✅ BEST PRACTICE: Never trust client-supplied amounts
const dbOrder = await prisma.order.findUnique({ where: { id: dbOrderId } });
const amount = toNum(dbOrder.total); // Use DB value, ignore client input
```
**Why it matters:** Prevents attacker from changing price to ₹1

### 2. HMAC-SHA256 Webhook Verification
```typescript
// ✅ BEST PRACTICE: Verify webhook authenticity
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

if (expectedSignature !== signature) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
}
```
**Why it matters:** Ensures webhook genuinely from Razorpay, not faked

### 3. Webhook De-duplication (Idempotency)
```typescript
// ✅ BEST PRACTICE: Handle webhook retries safely
const existing = await prisma.webhookEvent.findUnique({
  where: { eventId }
});
if (existing) {
  return NextResponse.json({ success: true }); // Already processed
}
```
**Why it matters:** If Razorpay retries webhook, order only charged once

### 4. Transactional Stock Restoration
```typescript
// ✅ BEST PRACTICE: Atomic operations on payment failure
await prisma.$transaction(async (tx) => {
  for (const item of orderItems) {
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } }
    });
  }
  await tx.order.update({
    where: { id: order.id },
    data: { status: 'failed' }
  });
});
```
**Why it matters:** Stock and order status stay in sync, no orphaned inventory

---

## Critical Gaps to Fix 🔴

### GAP 1: No 3DS Authentication (RBI Mandate)

**Current Issue:**
```typescript
// ❌ NO 3DS — violates RBI payment guidelines for India
const options = {
  key: orderData.key,
  amount: orderData.amount,
  // Missing: 3DS mandatory for ₹2000+ transactions
};
```

**Impact:**
- ❌ Non-compliant with RBI Payment System Operating Guidelines
- ❌ Payment processor can suspend merchant account
- ❌ Legal liability for unintended transactions

**Fix (2 hours):**
1. Go to Razorpay Dashboard → Settings → Security
2. Enable "3D Secure Authentication"
3. Set threshold: Mandatory for ₹2000+ and international cards
4. Update PayButton to support 3DS challenge

```typescript
// ✅ FIXED: 3DS automatically triggered by Razorpay
const options = {
  key: orderData.key,
  amount: orderData.amount,
  currency: 'INR',
  order_id: orderData.orderId,
  // Razorpay handles 3DS based on amount & rules
  handler: async function (response: any) {
    // If 3DS was required, customer already authenticated
    // Verify signature on backend (you already do this)
  },
};
```

**Testing:**
- Use Razorpay test card: `4111 1111 1111 1111`
- Amount ≥ ₹2000 should trigger 3DS challenge
- Verify OTP page appears before payment

---

### GAP 2: No Audit Logging (PCI-DSS Requirement)

**Current Issue:**
```typescript
// ❌ NO AUDIT TRAIL — violates PCI-DSS 3.2.1
// Payment events not logged with timestamps, IPs, user context
await prisma.order.update({
  where: { id: dbOrderId },
  data: { status: 'paid' }
});
// No record of WHO changed it, WHEN, FROM WHERE
```

**Impact:**
- ❌ Cannot prove payment compliance in audit
- ❌ PCI-DSS failure: 90-day remediation or merchant account suspended
- ❌ Legal liability for unauthorized transactions (no proof)

**Fix (6-8 hours):**

1. **Create PaymentAuditLog table:**
```prisma
model PaymentAuditLog {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  eventType       String   // "order_created" | "payment_captured" | "payment_failed" | "refund_issued"
  razorpayOrderId String
  razorpayPaymentId String?
  amount          Decimal  @db.Decimal(10,2)
  status          String   // "success" | "failed" | "pending"
  ipAddress       String?  // Customer's IP for fraud detection
  userAgent       String?  // Browser info
  userId          String?  // If authenticated user
  metadata        Json?    // Additional context
  createdAt       DateTime @default(now())

  @@index([orderId])
  @@index([razorpayOrderId])
  @@index([eventType])
  @@index([createdAt])
}
```

2. **Create migration:**
```bash
pnpm prisma migrate dev --name add_payment_audit_log
```

3. **Log all payment events:**
```typescript
// apps/web/lib/paymentAudit.ts
export async function logPaymentEvent(params: {
  orderId: string;
  eventType: 'order_created' | 'payment_captured' | 'payment_failed' | 'refund_issued';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  request: Request;
}) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ua = request.headers.get('user-agent');

  await prisma.paymentAuditLog.create({
    data: {
      orderId: params.orderId,
      eventType: params.eventType,
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      amount: params.amount,
      status: params.status,
      ipAddress: ip || 'unknown',
      userAgent: ua,
    },
  });
}
```

4. **Log in verify endpoint:**
```typescript
// apps/web/app/api/payments/razorpay/verify/route.ts
import { logPaymentEvent } from '@/lib/paymentAudit';

export async function POST(request: Request) {
  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, dbOrderId } = body;

  try {
    // ... signature verification ...
    
    // ✅ Log before updating order
    await logPaymentEvent({
      orderId: dbOrderId,
      eventType: 'payment_captured',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: order.total,
      status: 'success',
      request,
    });

    // Update order
    await prisma.order.update({...});
  } catch (error) {
    await logPaymentEvent({
      orderId: dbOrderId,
      eventType: 'payment_failed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: order.total,
      status: 'failed',
      request,
    });
  }
}
```

5. **Implement 90-day retention policy:**
```typescript
// apps/web/app/api/admin/maintenance/cleanup-audit-logs/route.ts
// Run daily via cron
export async function POST() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  const deleted = await prisma.paymentAuditLog.deleteMany({
    where: { createdAt: { lt: ninetyDaysAgo } }
  });
  
  return NextResponse.json({ deleted: deleted.count });
}
```

---

### GAP 3: No PCI-DSS Compliance Documentation

**Current Issue:**
```
❌ No SAQ-A (Self-Assessment Questionnaire)
❌ No data flow diagram
❌ No incident response procedure
```

**Fix (4-6 hours):**

1. **Create `PCI_COMPLIANCE.md`:**
```markdown
# PCI-DSS Compliance Status

## Merchant Level
- Using Razorpay for payment processing
- Qualified as Level 4 (outsourced payment gateway)
- SAQ-A compliance required

## Payment Data Flow
1. Customer enters card on Razorpay-hosted iframe (NOT your server)
2. Razorpay tokenizes → returns payment signature
3. Your server verifies signature (HMAC-SHA256)
4. Order marked as paid

## Compliance Checklist
- [x] HTTPS/TLS 1.2+ (Strict-Transport-Security header)
- [x] No cardholder data stored on your server
- [x] Webhook signature verification (HMAC-SHA256)
- [x] Audit logging of all payment events
- [x] Access controls (admin-only refund endpoint)
- [x] Incident response plan

## Retained Payment Data
- Order ID (internal)
- Razorpay Payment ID (opaque token)
- Amount, timestamp
- Customer email/phone (NOT card data)
- Payment audit log (90-day retention)

## Incident Response
1. Unauthorized transaction detected
   → Log in PaymentAuditLog
   → Contact Razorpay support
   → Notify customer within 72 hours
   → Document in IncidentLog

2. Data breach
   → Disable affected user accounts
   → Rotate secrets
   → Notify users
   → Report to NPCI (if payment system breach)
```

2. **Submit PCI-DSS SAQ-A:**
   - Go to razorpay.com → Business Docs → PCI-DSS
   - Download SAQ-A questionnaire
   - Answer compliance questions
   - Sign and file with Razorpay

---

### GAP 4: No Webhook Async Processing

**Current Issue:**
```typescript
// ❌ RISK: If sendEmail() times out, webhook returns 5xx
// Razorpay thinks webhook failed, retries multiple times
// Order status never updated → "phantom" unpaid orders
await prisma.order.update({
  where: { id: order.id },
  data: { status: 'paid' }
});

await sendEmail({...}); // If this times out > 30s, webhook fails
```

**Impact:**
- Customer gets duplicate charge notifications
- Support nightmare: "Why wasn't my payment confirmed?"

**Fix (4-6 hours):**

```typescript
// apps/web/app/api/payments/razorpay/webhook/route.ts
export const maxDuration = 60; // Vercel: 60s timeout max

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // 1. Verify signature immediately
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.id;

    // 2. Mark event as received FIRST (idempotency check)
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId }
    });
    if (existing) {
      return NextResponse.json({ success: true });
    }

    await prisma.webhookEvent.create({
      data: { provider: 'razorpay', eventId }
    });

    // 3. Return 200 immediately to Razorpay
    const response = NextResponse.json({ success: true });

    // 4. Process async (fire-and-forget)
    processWebhookAsync(event).catch(err => {
      logError('async_webhook_failed', err);
      // Save to failed queue for manual retry
    });

    return response;

  } catch (error: any) {
    logError("webhook_error", error);
    return NextResponse.json({ error: "Processing" }, { status: 500 });
  }
}

async function processWebhookAsync(event: any) {
  try {
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const order = await prisma.order.findFirst({
        where: { paymentId: payment.order_id }
      });

      if (order && order.status !== 'paid') {
        // Safe to update (already idempotency-checked)
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'paid', paymentId: payment.id }
        });

        // Now send email (can timeout, won't affect order)
        await sendEmail({...}).catch(() => {
          logError('email_send_failed', { orderId: order.id });
        });
      }
    }
  } catch (error) {
    logError('webhook_processing_failed', error);
    // Log to failed queue
    await prisma.failedWebhookEvent.create({
      data: {
        provider: 'razorpay',
        eventId: event.id,
        payload: event,
        errorMessage: JSON.stringify(error)
      }
    });
  }
}
```

---

### GAP 5: No Rate Limiting on Payment Endpoints

**Current Issue:**
```typescript
// ❌ Attacker can spam /api/payments/razorpay/order
// Creates unlimited Razorpay orders, wastes quota
export async function POST(request: Request) {
  const razorpayOrder = await razorpay.orders.create(options);
}
```

**Fix (2-3 hours):**

```typescript
// apps/web/app/api/payments/razorpay/order/route.ts
import { checkRateLimit } from '@/lib/rateLimit'; // You already have this!

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  
  // 5 orders per minute per IP
  if (!checkRateLimit(`payment:order:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many payment requests. Please try again in 1 minute.' },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { dbOrderId } = body;
  
  // ... rest of code
}
```

---

### GAP 6: No Refund Endpoint

**Current Issue:**
```
❌ Customer requests refund
❌ Admin has no way to refund via UI
❌ Manual Razorpay dashboard → error-prone
```

**Fix (4-6 hours):**

```typescript
// apps/web/app/api/admin/payments/refund/route.ts
import { getServerSession } from 'next-auth';
import { isOwner } from '@/lib/permissions';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!isOwner(session?.user?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orderId, reason, amount } = await request.json();

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.paymentId) {
      return NextResponse.json(
        { error: 'No payment to refund' },
        { status: 400 }
      );
    }

    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: `Order not in paid status (current: ${order.status})` },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const refundAmount = amount || Math.round(toNum(order.total) * 100);

    const refund = await razorpay.payments.refund(order.paymentId, {
      amount: refundAmount,
      notes: { reason, orderId },
    });

    // Log refund event
    await logPaymentEvent({
      orderId,
      eventType: 'refund_issued',
      razorpayPaymentId: order.paymentId,
      razorpayOrderId: order.paymentId,
      amount: refundAmount / 100,
      status: 'success',
      request,
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'refunded' },
    });

    // Send email to customer
    await sendEmail({
      to: order.email!,
      subject: `Refund Processed - Order ${orderId.slice(0, 8).toUpperCase()}`,
      html: `<p>Your refund of ₹${(refundAmount / 100).toFixed(2)} has been processed.</p>`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error: any) {
    logError('refund_failed', error);
    return NextResponse.json(
      { error: error.message || 'Refund failed' },
      { status: 500 }
    );
  }
}
```

---

## Implementation Checklist

### Before Go-Live
- [ ] Enable 3DS in Razorpay dashboard
- [ ] Create PaymentAuditLog table & migration
- [ ] Implement audit logging in webhook routes
- [ ] Create PCI-DSS SAQ-A documentation
- [ ] Test 3DS with Razorpay test cards
- [ ] Test audit logging in staging
- [ ] Submit SAQ-A to Razorpay
- [ ] Security team review & approval
- [ ] Compliance officer sign-off

### Month 1
- [ ] Implement webhook async processing
- [ ] Add rate limiting to payment endpoints
- [ ] Build refund endpoint (admin-only)
- [ ] Add Razorpay IP whitelist
- [ ] Create runbook for payment incidents

### Month 2
- [ ] Implement double-payment locking
- [ ] Add velocity fraud checks
- [ ] Build settlement reconciliation
- [ ] Quarterly compliance review

---

## References

- [Razorpay 3DS Docs](https://razorpay.com/docs/payments/smart-routing/mandates/3d-secure/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [PCI-DSS Compliance Guide](https://www.pcisecuritystandards.org/)
- [RBI Payment Guidelines](https://www.rbi.org.in/)
- [OWASP Payment Security](https://cheatsheetseries.owasp.org/)

---

## Questions?

Contact security team before go-live.