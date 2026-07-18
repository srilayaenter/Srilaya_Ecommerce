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

export function logAuthEvent(event: "register" | "login" | "login_failed" | "password_reset", params: {
  email: string;
  reason?: string;
}) {
  log.info(`auth.${event}`, params);
}

export function logError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  log.error(context, { error: message, ...extra });
}
