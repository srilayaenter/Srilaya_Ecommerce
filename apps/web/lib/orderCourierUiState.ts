// Pure UI-decision logic for Phase 4's courier visibility in the admin
// order pages — extracted so it's independently testable without rendering
// the full Server Component pages.

export type ShipmentEmptyStateCopy = {
  message: string;
  tone: "info" | "warning";
  prefillCourier: string;
};

// Decides what to show in the shipment card's empty state (no Shipment row
// yet) based on whether a checkout-time courier snapshot exists.
export function getShipmentEmptyStateCopy(
  courierLabel: string | null | undefined,
): ShipmentEmptyStateCopy {
  if (courierLabel) {
    return {
      tone: "info",
      message: `Customer selected ${courierLabel} at checkout. Confirm this courier or update the details below to mark as processing.`,
      prefillCourier: courierLabel,
    };
  }
  return {
    tone: "warning",
    message:
      "No courier information available for this order. Assign a courier manually to mark as processing.",
    prefillCourier: "",
  };
}

// Decides whether the order list page's "process" action for a pending order
// should route through the detail page (to review/confirm the courier first)
// rather than firing the pending -> processing transition directly.
//
// True only for online orders that have a checkout-time courier snapshot but
// no confirmed Shipment yet. In-store orders, and any order with no courier
// snapshot at all, keep the existing direct one-click behavior.
export function shouldRouteProcessThroughDetail(order: {
  orderChannel: string;
  courierLabel: string | null | undefined;
  hasShipment: boolean;
}): boolean {
  return (
    order.orderChannel !== "in_store" &&
    !!order.courierLabel &&
    !order.hasShipment
  );
}
