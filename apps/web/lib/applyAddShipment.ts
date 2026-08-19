import { prisma } from "@/lib/db";
import { isAllowedFulfillmentTransition, type FulfillmentStatus } from "@/lib/orderConstants";
import { logShipmentChange, logError } from "@/lib/logger";

// Roles permitted to create/update a shipment. Matches FULFILLMENT_ALLOWED_ROLES
// in applyFulfillmentStatusChange.ts, since a successful shipment write also
// transitions fulfillmentStatus to "processing" — same authority level as a
// direct fulfillment-status change.
const SHIPMENT_ALLOWED_ROLES = [
  "owner",
  "admin",
  "manager",
  "billing_staff",
] as const;
type ShipmentAllowedRole = (typeof SHIPMENT_ALLOWED_ROLES)[number];

function isShipmentAllowedRole(role: string): role is ShipmentAllowedRole {
  return (SHIPMENT_ALLOWED_ROLES as readonly string[]).includes(role);
}

export type AddShipmentOutcome =
  | {
      ok: true;
      // false when the submission was identical to the existing shipment
      // record — no DB write occurred and the caller must not resend the
      // dispatch email or treat this as a new event.
      changed: boolean;
      order: { id: string; email: string | null; customerName: string | null };
    }
  | {
      ok: false;
      reason:
        | "rejected_unauthorised"
        | "rejected_invalid_input"
        | "order_not_found"
        | "rejected_invalid_transition";
    };

/**
 * Core business logic for creating/updating an order's shipment by admin staff.
 * Authorized roles: owner, admin, manager, billing_staff (same as fulfillment
 * status changes).
 *
 * Phase 5: this is the SOLE entry point for the pending -> processing
 * transition on an online order that captured a courier snapshot at
 * checkout (applyFulfillmentStatusChange refuses that specific case and
 * defers to this function — see needsConfirmedShipmentBeforeProcessing).
 * The Shipment write and the fulfillmentStatus transition happen atomically
 * in one Prisma transaction, so it is never possible to observe a Shipment
 * row without the corresponding "processing" status, or vice versa.
 *
 * completed and cancelled are terminal states (Phase 5 decision 10): calling
 * this function on an order in either state is rejected outright — a
 * shipment can never be created or edited on a terminal order.
 *
 * If the order is already "processing" (e.g. editing shipment details after
 * the transition already happened), no fulfillmentStatus write occurs — only
 * the Shipment row is updated.
 *
 * Idempotent: resubmitting identical courier/tracking data is a no-op — no
 * DB write, no audit log entry, no dispatch email. This guards against
 * duplicate-click and retry scenarios re-sending the customer notification.
 *
 * The caller is responsible for:
 *   - Calling await log.flush() after this function returns.
 *   - Calling revalidatePath() when ok === true.
 *   - Sending the dispatch email only when ok === true && changed === true.
 */
export async function applyAddShipment({
  orderId,
  actorId,
  actorRole,
  courier,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
}: {
  orderId: string;
  actorId: string;
  actorRole: string;
  courier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  estimatedDelivery: Date | null;
}): Promise<AddShipmentOutcome> {
  // ── 1. Role check ────────────────────────────────────────────────────────
  if (!isShipmentAllowedRole(actorRole)) {
    logShipmentChange({
      orderId,
      actorId,
      actorRole,
      action: "created",
      courier,
      result: "rejected_unauthorised",
    });
    logError(
      "shipment.unauthorised",
      new Error("Insufficient role"),
      { orderId, actorId, actorRole },
    );
    return { ok: false, reason: "rejected_unauthorised" };
  }

  // ── 2. Input validation ──────────────────────────────────────────────────
  // The admin form marks these fields required, but a server action can be
  // invoked directly regardless of client-side validation.
  if (!orderId || !courier || !trackingNumber) {
    logError(
      "shipment.invalid_input",
      new Error("Missing required shipment fields"),
      { orderId, actorId, hasCourier: !!courier, hasTrackingNumber: !!trackingNumber },
    );
    return { ok: false, reason: "rejected_invalid_input" };
  }

  // ── 3. Fetch order + existing shipment ───────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      customerName: true,
      fulfillmentStatus: true,
      shipment: true,
    },
  });

  if (!order) {
    logError(
      "shipment.order_not_found",
      new Error("Order not found"),
      { orderId, actorId },
    );
    return { ok: false, reason: "order_not_found" };
  }

  // ── 4. Terminal-state guard ───────────────────────────────────────────────
  // completed and cancelled orders are immutable — a shipment can never be
  // created or edited on either (Phase 5 decision 10).
  const fromStatus = order.fulfillmentStatus as FulfillmentStatus;
  if (fromStatus === "completed" || fromStatus === "cancelled") {
    logShipmentChange({
      orderId,
      actorId,
      actorRole,
      action: order.shipment ? "updated" : "created",
      courier,
      result: "rejected_invalid_transition",
    });
    return { ok: false, reason: "rejected_invalid_transition" };
  }

  // ── 5. Idempotency guard ─────────────────────────────────────────────────
  const existing = order.shipment;
  const normalizedUrl = trackingUrl || null;
  const isIdenticalResubmission =
    existing != null &&
    existing.courier === courier &&
    existing.trackingNumber === trackingNumber &&
    (existing.trackingUrl ?? null) === normalizedUrl;

  if (isIdenticalResubmission) {
    return {
      ok: true,
      changed: false,
      order: { id: order.id, email: order.email, customerName: order.customerName },
    };
  }

  // ── 6. Determine whether this call also transitions fulfillmentStatus ───
  // Only pending -> processing is driven from here; if the order is already
  // "processing" this is just a shipment-detail update with no status write.
  const shouldTransitionToProcessing =
    fromStatus === "pending" &&
    isAllowedFulfillmentTransition(fromStatus, "processing");

  // ── 7. Apply write — Shipment + (optionally) fulfillmentStatus, atomically ─
  await prisma.$transaction(async (tx) => {
    await tx.shipment.upsert({
      where: { orderId },
      update: { courier, trackingNumber, trackingUrl: normalizedUrl, status: "booked" },
      create: {
        orderId,
        courier,
        trackingNumber,
        trackingUrl: normalizedUrl,
        status: "booked",
      },
    });

    if (shouldTransitionToProcessing) {
      await tx.order.update({
        where: { id: orderId },
        data: { fulfillmentStatus: "processing" },
      });
    }
  });

  logShipmentChange({
    orderId,
    actorId,
    actorRole,
    action: existing ? "updated" : "created",
    courier,
    result: "success",
  });

  return {
    ok: true,
    changed: true,
    order: { id: order.id, email: order.email, customerName: order.customerName },
  };
}
