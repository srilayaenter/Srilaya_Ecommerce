import { prisma } from "@/lib/db";
import { isValidFulfillmentStatus } from "@/lib/orderConstants";
import { logFulfillmentStatusChange, logError } from "@/lib/logger";

// Roles permitted to change fulfillment status.
// inventory_staff is explicitly excluded: UI path access is not sufficient
// authority; the server action must independently enforce this restriction.
// Owner decision recorded 16 August 2026.
const FULFILLMENT_ALLOWED_ROLES = [
  "owner",
  "admin",
  "manager",
  "billing_staff",
] as const;
type FulfillmentAllowedRole = (typeof FULFILLMENT_ALLOWED_ROLES)[number];

function isFulfillmentAllowedRole(
  role: string,
): role is FulfillmentAllowedRole {
  return (FULFILLMENT_ALLOWED_ROLES as readonly string[]).includes(role);
}

export type FulfillmentStatusChangeOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "rejected_unauthorised"
        | "rejected_invalid_status"
        | "order_not_found";
    };

/**
 * Core business logic for a fulfillment-status change by admin staff.
 * Authorized roles: owner, admin, manager, billing_staff.
 * inventory_staff is rejected server-side (owner decision 2026-08-16).
 *
 * Called by both updateFulfillmentStatus server actions (orders list page and
 * order detail page). Caller is responsible for:
 *   - Calling await log.flush() after this function returns.
 *   - Calling revalidatePath() when ok === true.
 *   - Fetching order data for any outbound notifications if ok === true.
 *
 * This function only writes fulfillmentStatus — never touches payment status.
 */
export async function applyFulfillmentStatusChange({
  orderId,
  newStatus,
  actorId,
  actorRole,
}: {
  orderId: string;
  newStatus: string;
  actorId: string;
  actorRole: string;
}): Promise<FulfillmentStatusChangeOutcome> {
  // ── 1. Role check ────────────────────────────────────────────────────────
  if (!isFulfillmentAllowedRole(actorRole)) {
    logFulfillmentStatusChange({
      orderId,
      actorId,
      actorRole,
      fromStatus: "unknown", // order not yet fetched
      toStatus: newStatus,
      result: "rejected_unauthorised",
    });
    logError(
      "fulfillment.status_change.unauthorised",
      new Error("Insufficient role"),
      { orderId, actorId, actorRole, toStatus: newStatus },
    );
    return { ok: false, reason: "rejected_unauthorised" };
  }

  // ── 2. Enum validation ────────────────────────────────────────────────────
  if (!isValidFulfillmentStatus(newStatus)) {
    logFulfillmentStatusChange({
      orderId,
      actorId,
      actorRole,
      fromStatus: "unknown", // order not yet fetched
      toStatus: newStatus,
      result: "rejected_invalid_status",
    });
    return { ok: false, reason: "rejected_invalid_status" };
  }

  // ── 3. Fetch current order ────────────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, fulfillmentStatus: true },
  });

  if (!order) {
    logError(
      "fulfillment.status_change.order_not_found",
      new Error("Order not found"),
      { orderId, actorId },
    );
    return { ok: false, reason: "order_not_found" };
  }

  // ── 4. No-op guard ────────────────────────────────────────────────────────
  if (order.fulfillmentStatus === newStatus) {
    return { ok: true };
  }

  // ── 5. Apply update — fulfillmentStatus only, payment status untouched ───
  await prisma.order.update({
    where: { id: orderId },
    data: { fulfillmentStatus: newStatus },
  });

  logFulfillmentStatusChange({
    orderId,
    actorId,
    actorRole,
    fromStatus: order.fulfillmentStatus,
    toStatus: newStatus,
    result: "success",
  });

  return { ok: true };
}
