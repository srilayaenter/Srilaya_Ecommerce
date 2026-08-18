import { prisma } from "@/lib/db";
import {
  isValidFulfillmentStatus,
  isAllowedFulfillmentTransition,
  isCustomerAllowedFulfillmentTransition,
  needsConfirmedShipmentBeforeProcessing,
  type FulfillmentStatus,
} from "@/lib/orderConstants";
import { logFulfillmentStatusChange, logError } from "@/lib/logger";
import type { Prisma } from "@prisma/client";

// Roles permitted to change fulfillment status as staff.
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
        | "order_not_found"
        | "rejected_invalid_transition"
        | "rejected_missing_shipment"
        | "rejected_customer_scope";
    };

type TxClient = Prisma.TransactionClient | typeof prisma;

/**
 * Core business logic for a fulfillment-status change — the single
 * server-side source of truth for every fulfillmentStatus write in the
 * system (Phase 5). Enforces, in order:
 *   1. Actor authorization (staff role, or customer self-service scope).
 *   2. Enum validity of the requested status.
 *   3. The transition matrix (FULFILLMENT_TRANSITIONS) — completed and
 *      cancelled are terminal; pending->completed and processing->pending
 *      are never allowed.
 *   4. Customer-specific scope: a customer actor may only ever request
 *      pending -> cancelled, even though processing -> cancelled is a valid
 *      transition for staff.
 *   5. The courier/shipment prerequisite on pending -> processing: an online
 *      order with a checkout courier snapshot must already have a confirmed
 *      Shipment. It never creates one here — that can only happen atomically
 *      via applyAddShipment, which is the sole entry point for that specific
 *      case.
 *
 * actorType:
 *   - "staff" (default): actorRole must be one of FULFILLMENT_ALLOWED_ROLES.
 *   - "customer": authorization is the caller's responsibility (e.g. the
 *     email-match check in /api/orders/cancel) — this function only enforces
 *     the transition SCOPE a customer may request, not their identity.
 *
 * tx: optional Prisma transaction client, so a caller (e.g. the customer
 * cancel route, which also restocks inventory) can run this atomically
 * alongside its own writes. Defaults to the top-level `prisma` client.
 *
 * Caller is responsible for:
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
  actorType = "staff",
  tx,
}: {
  orderId: string;
  newStatus: string;
  actorId: string;
  actorRole: string;
  actorType?: "staff" | "customer";
  tx?: TxClient;
}): Promise<FulfillmentStatusChangeOutcome> {
  const db = tx ?? prisma;

  // ── 1. Actor authorization ──────────────────────────────────────────────
  if (actorType === "staff" && !isFulfillmentAllowedRole(actorRole)) {
    logFulfillmentStatusChange({
      orderId,
      actorId,
      actorRole,
      actorType,
      fromStatus: "unknown", // order not yet fetched
      toStatus: newStatus,
      result: "rejected_unauthorised",
    });
    logError(
      "fulfillment.status_change.unauthorised",
      new Error("Insufficient role"),
      { orderId, actorId, actorRole, actorType, toStatus: newStatus },
    );
    return { ok: false, reason: "rejected_unauthorised" };
  }

  // ── 2. Enum validation ────────────────────────────────────────────────────
  if (!isValidFulfillmentStatus(newStatus)) {
    logFulfillmentStatusChange({
      orderId,
      actorId,
      actorRole,
      actorType,
      fromStatus: "unknown", // order not yet fetched
      toStatus: newStatus,
      result: "rejected_invalid_status",
    });
    return { ok: false, reason: "rejected_invalid_status" };
  }

  // ── 3. Fetch current order ────────────────────────────────────────────────
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      fulfillmentStatus: true,
      orderChannel: true,
      courierLabel: true,
      shipment: { select: { id: true } },
    },
  });

  if (!order) {
    logError(
      "fulfillment.status_change.order_not_found",
      new Error("Order not found"),
      { orderId, actorId },
    );
    return { ok: false, reason: "order_not_found" };
  }

  const fromStatus = order.fulfillmentStatus as FulfillmentStatus;

  // ── 4. No-op guard ────────────────────────────────────────────────────────
  if (fromStatus === newStatus) {
    return { ok: true };
  }

  // ── 5. Customer scope restriction ────────────────────────────────────────
  // A customer actor may only ever request pending -> cancelled, even though
  // processing -> cancelled is a valid transition for staff (Phase 5
  // decision 8a/8b).
  if (
    actorType === "customer" &&
    !isCustomerAllowedFulfillmentTransition(fromStatus, newStatus)
  ) {
    logFulfillmentStatusChange({
      orderId,
      actorId,
      actorRole,
      actorType,
      fromStatus,
      toStatus: newStatus,
      result: "rejected_customer_scope",
    });
    return { ok: false, reason: "rejected_customer_scope" };
  }

  // ── 6. Transition matrix ─────────────────────────────────────────────────
  // completed and cancelled are terminal; pending->completed and
  // processing->pending are never allowed, regardless of actor.
  if (!isAllowedFulfillmentTransition(fromStatus, newStatus)) {
    logFulfillmentStatusChange({
      orderId,
      actorId,
      actorRole,
      actorType,
      fromStatus,
      toStatus: newStatus,
      result: "rejected_invalid_transition",
    });
    return { ok: false, reason: "rejected_invalid_transition" };
  }

  // ── 7. Courier/shipment prerequisite (pending -> processing only) ───────
  // This function never creates a Shipment itself — an online order with a
  // courier snapshot and no confirmed Shipment must go through
  // applyAddShipment, which performs the Shipment creation and this
  // transition atomically in one call.
  if (fromStatus === "pending" && newStatus === "processing") {
    const blocked = needsConfirmedShipmentBeforeProcessing({
      orderChannel: order.orderChannel,
      courierLabel: order.courierLabel,
      hasShipment: !!order.shipment,
    });
    if (blocked) {
      logFulfillmentStatusChange({
        orderId,
        actorId,
        actorRole,
        actorType,
        fromStatus,
        toStatus: newStatus,
        result: "rejected_missing_shipment",
      });
      return { ok: false, reason: "rejected_missing_shipment" };
    }
  }

  // ── 8. Apply update — fulfillmentStatus only, payment status untouched ───
  await db.order.update({
    where: { id: orderId },
    data: { fulfillmentStatus: newStatus },
  });

  logFulfillmentStatusChange({
    orderId,
    actorId,
    actorRole,
    actorType,
    fromStatus,
    toStatus: newStatus,
    result: "success",
  });

  return { ok: true };
}
