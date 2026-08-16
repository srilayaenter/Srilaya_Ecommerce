// ─────────────────────────────────────────────────────────────────────────────
// Payment status — Order.status column
// ─────────────────────────────────────────────────────────────────────────────

// All status values that may be stored in Order.status.
// Covers every write path: checkout, Razorpay, in-store, COD collection, and
// the cron job that expires abandoned orders.
//
// Legacy note: the GST-report route queries for "cod_paid" in a read-only
// WHERE clause. That value has never been written by any current code path and
// does not appear in the DB. It is deliberately excluded here; callers that
// need backward-compat reads against historical data must add it locally.
export const PAYMENT_STATUSES = [
  "pending", // order created, awaiting payment
  "cod_pending", // COD order placed, awaiting cash/UPI collection
  "paid", // payment confirmed (online, COD collected, or in-store)
  "failed", // Razorpay payment failed
  "cancelled", // cancelled by customer or admin
  "expired", // abandoned pending order cleaned up by cron
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Subset of payment statuses that admin staff are permitted to set manually
// via UI actions. Excludes "expired" (cron-only, never set by a human) and any
// legacy aliases.
export const ADMIN_WRITABLE_PAYMENT_STATUSES = [
  "pending",
  "cod_pending",
  "paid",
  "failed",
  "cancelled",
] as const;

export type AdminWritablePaymentStatus =
  (typeof ADMIN_WRITABLE_PAYMENT_STATUSES)[number];

// Type guard — accepts any value that can be stored in Order.status.
// Use for read-path validation (display, queries). For write-path validation
// in admin server actions use isAdminWritablePaymentStatus.
export function isValidPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    (PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}

// Type guard — accepts only the status values admin staff may write manually.
// Rejects "expired" and any unknown value. Use in admin server actions before
// writing to the database.
export function isAdminWritablePaymentStatus(
  value: unknown,
): value is AdminWritablePaymentStatus {
  return (
    typeof value === "string" &&
    (ADMIN_WRITABLE_PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fulfillment status — Order.fulfillmentStatus column
// ─────────────────────────────────────────────────────────────────────────────

// All status values stored in Order.fulfillmentStatus.
// "delivered" is referenced in a dead code path in the order-detail page but
// is never submitted by any current UI button and is excluded here.
export const FULFILLMENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

// Type guard for Order.fulfillmentStatus.
export function isValidFulfillmentStatus(
  value: unknown,
): value is FulfillmentStatus {
  return (
    typeof value === "string" &&
    (FULFILLMENT_STATUSES as readonly string[]).includes(value)
  );
}
