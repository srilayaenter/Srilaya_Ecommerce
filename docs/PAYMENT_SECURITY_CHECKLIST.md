# Payment Security Implementation Checklist

## Phase 1: Critical (Before Go-Live) ✋ BLOCKER

### 1. Enable 3DS Authentication
- [ ] Log into Razorpay Dashboard
- [ ] Navigate to Settings → Security
- [ ] Enable "3D Secure Authentication"
- [ ] Set threshold: Mandatory for ₹2000+ transactions
- [ ] Configure international card 3DS: Always ON
- [ ] Test with Razorpay test card: `4111 1111 1111 1111`
- [ ] Verify OTP page appears for amounts ≥ ₹2000
- [ ] Document 3DS implementation in PayButton component

**Timeline:** 2-4 hours

### 2. Create Audit Logging System
- [ ] Create `PaymentAuditLog` table (Prisma schema)
  - orderId, eventType, razorpayOrderId, razorpayPaymentId
  - amount, status, ipAddress, userAgent, userId, metadata
  - Indexes on orderId, razorpayOrderId, eventType, createdAt
- [ ] Generate & run migration: `pnpm prisma migrate dev`
- [ ] Create `apps/web/lib/paymentAudit.ts` utility
- [ ] Add `logPaymentEvent()` calls to all webhook routes
- [ ] Add `logPaymentEvent()` calls to verify endpoint
- [ ] Implement 90-day retention cleanup job
- [ ] Test audit logging in staging

**Timeline:** 6-8 hours

### 3. Create PCI-DSS Compliance Documentation
- [ ] Create `PCI_COMPLIANCE.md` file
  - Payment data flow diagram (ASCII art OK)
  - Compliance checklist
  - Incident response procedure
- [ ] Download PCI-DSS SAQ-A from Razorpay
- [ ] Complete questionnaire (answer all sections)
- [ ] Have compliance officer review
- [ ] Sign & submit to Razorpay
- [ ] Retain signed copy for audit

**Timeline:** 4-6 hours

### 4. Testing & Validation
- [ ] Test all 3 payment flows in staging:
  - Online payment (Razorpay)
  - COD (Cash on Delivery)
  - Discount/loyalty combinations
- [ ] Verify audit logs created for each transaction
- [ ] Verify 3DS challenge appears on test cards
- [ ] Verify webhook processing handles retries
- [ ] Get security team approval
- [ ] Get compliance team sign-off

**Timeline:** 2-3 hours

**Go-Live Gate:** All Phase 1 items complete ✋

---

## Phase 2: High-Priority (Month 1)

### 5. Webhook Async Processing
- [ ] Move email/notification sending to async function
- [ ] Return 200 to Razorpay immediately
- [ ] Create FailedWebhookEvent table for retries
- [ ] Add exponential backoff for failed webhooks
- [ ] Test webhook timeout scenarios

**Timeline:** 4-6 hours

### 6. Payment Endpoint Rate Limiting
- [ ] Add rate limit check to `/api/payments/razorpay/order`
- [ ] Limit: 5 orders per minute per IP
- [ ] Add rate limit check to `/api/payments/razorpay/verify`
- [ ] Limit: 10 verifications per minute per user
- [ ] Test rate limiting with rapid requests

**Timeline:** 2-3 hours

### 7. Build Refund Endpoint
- [ ] Create `apps/web/app/api/admin/payments/refund/route.ts`
- [ ] Admin-only authorization check
- [ ] Razorpay refund API integration
- [ ] Audit log refund event
- [ ] Send refund confirmation email to customer
- [ ] Test refund in staging
- [ ] Create admin UI for refund button

**Timeline:** 4-6 hours

### 8. Webhook IP Whitelist
- [ ] Add Razorpay IP ranges to whitelist
- [ ] Get latest from Razorpay docs (or: 103.15.140.0/24, etc.)
- [ ] Add check in webhook route (logged but not blocking)
- [ ] Test webhook from unknown IP (should still work)

**Timeline:** 2 hours

---

## Phase 3: Medium-Priority (Month 2)

### 9. Double-Payment Prevention
- [ ] Add optimistic locking to order payment update
- [ ] Check order.status before creating new Razorpay order
- [ ] Return 409 if order was already updated
- [ ] Test concurrent payment attempts

**Timeline:** 3-4 hours

### 10. Velocity Fraud Checks
- [ ] Log payment attempts per email/phone
- [ ] Alert if >5 payments in 1 hour
- [ ] Alert if payment from new country
- [ ] Alert if payment from VPN/proxy IP
- [ ] Block if velocity threshold exceeded

**Timeline:** 4-6 hours

### 11. Settlement Reconciliation
- [ ] Create daily batch job: Compare Razorpay settlements vs. orders
- [ ] Alert on missing settlements
- [ ] Generate settlement report
- [ ] Test reconciliation logic

**Timeline:** 4-6 hours

---

## Continuous Operations (Ongoing)

### Monthly Security Review
- [ ] Review new Razorpay security advisories
- [ ] Review PaymentAuditLog for anomalies
- [ ] Check for failed webhooks
- [ ] Verify rate limiting effectiveness
- [ ] Test incident response procedures

### Quarterly Compliance Audit
- [ ] PCI-DSS compliance check
- [ ] Audit log retention verification (90 days)
- [ ] Refund processing audit
- [ ] Webhook signature verification test

### Annual Penetration Testing
- [ ] Hire external firm for payment flow testing
- [ ] Test fraud scenarios
- [ ] Test auth bypass attempts
- [ ] Document findings & remediation

---

## Go-Live Checklist

**Only launch if ALL of these are complete:**

### Security
- [ ] 3DS enabled in Razorpay
- [ ] Audit logging implemented & tested
- [ ] HSTS header in place (1 year)
- [ ] CSP configured for Razorpay domain
- [ ] All secrets in Vercel env (not in code)
- [ ] Security team sign-off email

### Compliance
- [ ] PCI-DSS SAQ-A completed & submitted
- [ ] Compliance officer approval
- [ ] 90-day retention policy defined
- [ ] Incident response runbook created

### Testing
- [ ] E2E payment tests pass (online, COD, combo)
- [ ] Refund endpoint tested (if implemented)
- [ ] Webhook retry handling tested
- [ ] Rate limiting tested
- [ ] Load test: 100 concurrent orders

### Documentation
- [ ] PAYMENT_SECURITY_AUDIT.md reviewed by team
- [ ] Runbook for payment incidents created
- [ ] Admin guide for refunds written
- [ ] Customer support FAQ updated

---

## Emergency Contacts

- **Security Lead:** [TBD]
- **Compliance Officer:** [TBD]
- **Razorpay Support:** https://razorpay.com/support
- **RBI Helpline:** 1800-180-1111
