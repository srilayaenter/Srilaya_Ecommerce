import { prisma } from "@/lib/db";
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
        | "order_not_found";
    };

/**
 * Core business logic for creating/updating an order's shipment by admin staff.
 * Authorized roles: owner, admin, manager, billing_staff (same as fulfillment
 * status changes, since this also transitions fulfillmentStatus to "processing").
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

  // ── 4. Idempotency guard ─────────────────────────────────────────────────
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

  // ── 5. Apply write ───────────────────────────────────────────────────────
  await prisma.shipment.upsert({
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

  await prisma.order.update({
    where: { id: orderId },
    data: { fulfillmentStatus: "processing" },
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
