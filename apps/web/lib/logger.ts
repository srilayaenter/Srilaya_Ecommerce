import { Logger } from "next-axiom";

// Shared structured logger. Use log.info/warn/error in server actions and
// API routes; call await log.flush() before returning from each handler.
// In development (no AXIOM_TOKEN), all log calls are no-ops.
export const log = new Logger();

// Convenience typed event helpers — keeps field shapes consistent across routes.

export function logOrderPlaced(params: {
  orderId: string;
  invoiceNo: string;
  customerName: string;
  email: string;
  total: number;
  paymentMethod: string;
  itemCount: number;
  city: string;
  state: string;
}) {
  log.info("order.placed", params);
}

export function logPaymentVerified(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  total: number;
  email: string;
}) {
  log.info("payment.verified", params);
}

export function logPaymentFailed(params: {
  orderId?: string;
  razorpayOrderId?: string;
  reason: string;
  email?: string;
  total?: number;
}) {
  log.warn("payment.failed", params);
}

export function logOrderCancelled(params: {
  orderId: string;
  reason: string;
  email?: string;
}) {
  log.info("order.cancelled", params);
}

export function logAuthEvent(
  event: "register" | "login" | "login_failed" | "password_reset",
  params: {
    email: string;
    reason?: string;
  },
) {
  log.info(`auth.${event}`, params);
}

export function logError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
) {
  const message = error instanceof Error ? error.message : String(error);
  log.error(context, { error: message, ...extra });
}

// Union of outcomes for a manual payment-status change attempt.
// "success" → status was written to the DB.
// All other values → the change was rejected before any DB write.
export type PaymentStatusChangeResult =
  | "success"
  | "rejected_unauthorised"
  | "rejected_invalid_status"
  | "rejected_cancelled_order"
  | "rejected_ineligible_order";

// Union of outcomes for a fulfillment-status change attempt.
export type FulfillmentStatusChangeResult =
  | "success"
  | "rejected_unauthorised"
  | "rejected_invalid_status";

// Audit log for every fulfillment-status change attempt by admin staff.
// Logs non-sensitive metadata only — do NOT pass email, phone, secrets, or
// payment references in params.
export function logFulfillmentStatusChange(params: {
  orderId: string;
  actorId: string;
  actorRole: string;
  fromStatus: string;
  toStatus: string;
  result: FulfillmentStatusChangeResult;
}) {
  if (params.result === "success") {
    log.info("fulfillment.status_changed", params);
  } else {
    log.warn("fulfillment.status_change_rejected", params);
  }
}

// Audit log for every manual payment-status change attempt by admin staff.
// Logs non-sensitive metadata only: actor identity, role, order reference,
// old/new status values, and the operation outcome.
// Do NOT pass passwords, tokens, card data, customer contact details,
// UPI reference numbers, or any secret value in params.
export function logPaymentStatusChange(params: {
  orderId: string;
  actorId: string;
  actorRole: string;
  fromStatus: string;
  toStatus: string;
  source: "manual_update" | "cod_collected";
  result: PaymentStatusChangeResult;
}) {
  if (params.result === "success") {
    log.info("payment.status_changed", params);
  } else {
    log.warn("payment.status_change_rejected", params);
  }
}
