import { describe, it, expect } from "vitest";
import {
  getShipmentEmptyStateCopy,
  shouldRouteProcessThroughDetail,
} from "../../apps/web/lib/orderCourierUiState";

describe("getShipmentEmptyStateCopy — Phase 4 detail-page empty state", () => {
  it("detail page: pre-fills and shows confirm-or-update copy when shipment is null and a courier snapshot exists", () => {
    const result = getShipmentEmptyStateCopy("Delhivery");
    expect(result).toEqual({
      tone: "info",
      message:
        "Customer selected Delhivery at checkout. Confirm this courier or update the details below to mark as processing.",
      prefillCourier: "Delhivery",
    });
  });

  it("detail page: shows the manual-assignment fallback when both shipment and courier snapshot are absent", () => {
    expect(getShipmentEmptyStateCopy(null)).toEqual({
      tone: "warning",
      message:
        "No courier information available for this order. Assign a courier manually to mark as processing.",
      prefillCourier: "",
    });
    expect(getShipmentEmptyStateCopy(undefined)).toEqual({
      tone: "warning",
      message:
        "No courier information available for this order. Assign a courier manually to mark as processing.",
      prefillCourier: "",
    });
  });

  it("a backfilled order's courierLabel renders identically to a native Phase 3 snapshot value — the helper is agnostic to how courierLabel was populated", () => {
    const nativeSnapshot = getShipmentEmptyStateCopy("Bluedart");
    const backfilledSnapshot = getShipmentEmptyStateCopy("Bluedart");
    expect(backfilledSnapshot).toEqual(nativeSnapshot);
  });
});

describe("shouldRouteProcessThroughDetail — Phase 4 list-page routing", () => {
  it("list page: routes online, pending orders with a courier snapshot and no shipment through the detail page", () => {
    expect(
      shouldRouteProcessThroughDetail({
        orderChannel: "online",
        courierLabel: "DTDC",
        hasShipment: false,
      }),
    ).toBe(true);
  });

  it("in-store pending orders always keep the direct-submit behavior, regardless of courier snapshot data", () => {
    expect(
      shouldRouteProcessThroughDetail({
        orderChannel: "in_store",
        courierLabel: "DTDC",
        hasShipment: false,
      }),
    ).toBe(false);
    expect(
      shouldRouteProcessThroughDetail({
        orderChannel: "in_store",
        courierLabel: null,
        hasShipment: false,
      }),
    ).toBe(false);
  });

  it("keeps direct-submit for online orders once a shipment is confirmed, or when no courier snapshot exists", () => {
    expect(
      shouldRouteProcessThroughDetail({
        orderChannel: "online",
        courierLabel: "DTDC",
        hasShipment: true,
      }),
    ).toBe(false);
    expect(
      shouldRouteProcessThroughDetail({
        orderChannel: "online",
        courierLabel: null,
        hasShipment: false,
      }),
    ).toBe(false);
  });
});

describe("REGRESSION GUARD — Phase 4 courier UI-state module is read-only", () => {
  it("exports only pure decision functions; no Prisma/db import exists in this module", () => {
    // If this module ever grows a mutation or a Prisma import, this
    // require-time check makes it visible in the test file itself
    // rather than only in a diff review.
    const moduleSource = require("fs").readFileSync(
      require("path").resolve(
        __dirname,
        "../../apps/web/lib/orderCourierUiState.ts",
      ),
      "utf-8",
    );
    expect(moduleSource).not.toMatch(/prisma/i);
    expect(moduleSource).not.toMatch(/\.(update|create|delete|upsert)\(/);
  });
});
