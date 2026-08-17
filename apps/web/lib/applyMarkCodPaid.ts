import { prisma } from "@/lib/db";
import { logPaymentStatusChange, logError } from "@/lib/logger";

// Roles permitted to collect COD payment.
// Matches the permission set for updatePaymentStatus (Q1 decision).
const ALLOWED_ROLES = ["owner", "admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

function isAllowedRole(role: string): role is AllowedRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role);
}

export type MarkCodPaidOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "rejected_unauthorised"
        | "rejected_ineligible_order"
        | "order_not_found";
    };

/**
 * Core business logic for marking a COD order as collected by admin staff.
 * Only orders in "cod_pending" status are eligible — this guards against
 * collecting on non-COD orders, already-paid orders, cancelled, expired,
 * or failed orders.
 *
 * The caller is responsible for:
 *   - Calling await log.flush() after this function returns.
 *   - Calling revalidatePath() when ok === true.
 *
 * Do NOT pass codUpiRef or any payment reference through the audit log.
 */
export async function applyMarkCodPaid({
  orderId,
  actorId,
  actorRole,
  codPaymentMethod,
  codUpiRef,
}: {
  orderId: string;
  actorId: string;
  actorRole: string;
  codPaymentMethod: string;
  codUpiRef: string | null;
}): Promise<MarkCodPaidOutcome> {
  // ── 1. Role check ────────────────────────────────────────────────────────
  if (!isAllowedRole(actorRole)) {
    logPaymentStatusChange({
      orderId,
      actorId,
      actorRole,
      fromStatus: "unknown", // order not yet fetched
      toStatus: "paid",
      source: "cod_collected",
      result: "rejected_unauthorised",
    });
    logError(
      "payment.cod_collection.unauthorised",
      new Error("Insufficient role"),
      {
        orderId,
        actorId,
        actorRole,
      },
    );
    return { ok: false, reason: "rejected_unauthorised" };
  }

  // ── 2. Fetch current order ────────────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) {
    logError(
      "payment.cod_collection.order_not_found",
      new Error("Order not found"),
      {
        orderId,
        actorId,
      },
    );
    return { ok: false, reason: "order_not_found" };
  }

  // ── 3. Eligibility guard ──────────────────────────────────────────────────
  // Only "cod_pending" orders are eligible for collection.
  // Rejects: non-COD orders (status "pending"), already paid, cancelled,
  // expired, and failed — all in a single check.
  if (order.status !== "cod_pending") {
    logPaymentStatusChange({
      orderId,
      actorId,
      actorRole,
      fromStatus: order.status,
      toStatus: "paid",
      source: "cod_collected",
      result: "rejected_ineligible_order",
    });
    return { ok: false, reason: "rejected_ineligible_order" };
  }

  // ── 4. Apply update ───────────────────────────────────────────────────────
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "paid", codPaymentMethod, codUpiRef: codUpiRef || null },
  });

  logPaymentStatusChange({
    orderId,
    actorId,
    actorRole,
    fromStatus: "cod_pending",
    toStatus: "paid",
    source: "cod_collected",
    result: "success",
  });

  return { ok: true };
}
