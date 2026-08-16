import { prisma } from "@/lib/db";
import { isAdminWritablePaymentStatus } from "@/lib/orderConstants";
import { log, logPaymentStatusChange, logError } from "@/lib/logger";

// Roles permitted to write payment status manually.
// Q1 decision: manager excluded.
const ALLOWED_ROLES = ["owner", "admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

function isAllowedRole(role: string): role is AllowedRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role);
}

export type PaymentStatusChangeOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "rejected_unauthorised"
        | "rejected_invalid_status"
        | "rejected_cancelled_order"
        | "order_not_found";
    };

/**
 * Core business logic for a manual payment-status change by admin staff.
 * Called by the server action; receives already-extracted session fields so
 * this function can be unit-tested without mocking next-auth.
 *
 * The caller is responsible for:
 *   - Calling await log.flush() after this function returns.
 *   - Calling revalidatePath() when ok === true.
 */
export async function applyPaymentStatusChange({
  orderId,
  newStatus,
  actorId,
  actorRole,
}: {
  orderId: string;
  newStatus: string;
  actorId: string;
  actorRole: string;
}): Promise<PaymentStatusChangeOutcome> {
  // ── 1. Role check ────────────────────────────────────────────────────────
  if (!isAllowedRole(actorRole)) {
    logPaymentStatusChange({
      orderId,
      actorId,
      actorRole,
      fromStatus: "unknown", // order not yet fetched
      toStatus: newStatus,
      source: "manual_update",
      result: "rejected_unauthorised",
    });
    logError(
      "payment.status_change.unauthorised",
      new Error("Insufficient role"),
      {
        orderId,
        actorId,
        actorRole,
        toStatus: newStatus,
      },
    );
    return { ok: false, reason: "rejected_unauthorised" };
  }

  // ── 2. Enum validation — must use isAdminWritablePaymentStatus ────────────
  if (!isAdminWritablePaymentStatus(newStatus)) {
    logPaymentStatusChange({
      orderId,
      actorId,
      actorRole,
      fromStatus: "unknown", // order not yet fetched
      toStatus: newStatus,
      source: "manual_update",
      result: "rejected_invalid_status",
    });
    return { ok: false, reason: "rejected_invalid_status" };
  }

  // ── 3. Fetch current order ────────────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) {
    logError(
      "payment.status_change.order_not_found",
      new Error("Order not found"),
      {
        orderId,
        actorId,
      },
    );
    return { ok: false, reason: "order_not_found" };
  }

  // ── 4. Old-status guard: cancelled orders are immutable ───────────────────
  if (order.status === "cancelled") {
    logPaymentStatusChange({
      orderId,
      actorId,
      actorRole,
      fromStatus: order.status,
      toStatus: newStatus,
      source: "manual_update",
      result: "rejected_cancelled_order",
    });
    return { ok: false, reason: "rejected_cancelled_order" };
  }

  // ── 5. No-op guard: skip redundant writes ─────────────────────────────────
  if (order.status === newStatus) {
    return { ok: true };
  }

  // ── 6. Apply update ───────────────────────────────────────────────────────
  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  logPaymentStatusChange({
    orderId,
    actorId,
    actorRole,
    fromStatus: order.status,
    toStatus: newStatus,
    source: "manual_update",
    result: "success",
  });

  return { ok: true };
}
