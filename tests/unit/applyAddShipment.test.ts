import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-axiom before any logger import.
vi.mock("next-axiom", () => ({
  Logger: class {
    info = vi.fn();
    warn = vi.fn();
    error = vi.fn();
    flush = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    shipment: {
      upsert: vi.fn(),
    },
  },
}));

import { applyAddShipment } from "../../apps/web/lib/applyAddShipment";
import { prisma } from "../../apps/web/lib/db";
import { log } from "../../apps/web/lib/logger";

const mockFindUnique = vi.mocked(prisma.order.findUnique);
const mockOrderUpdate = vi.mocked(prisma.order.update);
const mockShipmentUpsert = vi.mocked(prisma.shipment.upsert);

const ORDER_NO_SHIPMENT = {
  id: "order-001",
  email: "customer@example.com",
  customerName: "Jane Doe",
  shipment: null,
};

const ORDER_WITH_SHIPMENT = {
  id: "order-001",
  email: "customer@example.com",
  customerName: "Jane Doe",
  shipment: {
    courier: "DTDC",
    trackingNumber: "AWB123",
    trackingUrl: "https://track.example.com/AWB123",
  },
};

const call = (overrides: Partial<Parameters<typeof applyAddShipment>[0]> = {}) => ({
  orderId: "order-001",
  actorId: "user-001",
  actorRole: "admin",
  courier: "DTDC",
  trackingNumber: "AWB123",
  trackingUrl: "https://track.example.com/AWB123",
  estimatedDelivery: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockFindUnique.mockResolvedValue(ORDER_NO_SHIPMENT as any);
  mockShipmentUpsert.mockResolvedValue({} as any);
  mockOrderUpdate.mockResolvedValue({} as any);
});

describe("applyAddShipment — authorization", () => {
  it.each(["owner", "admin", "manager", "billing_staff"])(
    "allows role %s",
    async (role) => {
      const result = await applyAddShipment(call({ actorRole: role }));
      expect(result.ok).toBe(true);
      expect(mockShipmentUpsert).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["inventory_staff", "customer", "", "unknown_role"])(
    "rejects role %s and performs no write",
    async (role) => {
      const result = await applyAddShipment(call({ actorRole: role }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("rejected_unauthorised");
      expect(mockShipmentUpsert).not.toHaveBeenCalled();
      expect(mockOrderUpdate).not.toHaveBeenCalled();
    },
  );
});

describe("applyAddShipment — input validation", () => {
  it("rejects missing courier", async () => {
    const result = await applyAddShipment(call({ courier: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
    expect(mockShipmentUpsert).not.toHaveBeenCalled();
  });

  it("rejects missing trackingNumber", async () => {
    const result = await applyAddShipment(call({ trackingNumber: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
    expect(mockShipmentUpsert).not.toHaveBeenCalled();
  });
});

describe("applyAddShipment — order lookup", () => {
  it("returns order_not_found when the order doesn't exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await applyAddShipment(call());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("order_not_found");
    expect(mockShipmentUpsert).not.toHaveBeenCalled();
  });
});

describe("applyAddShipment — create vs update vs idempotent no-op", () => {
  it("creates a new shipment when none exists, returns changed: true", async () => {
    mockFindUnique.mockResolvedValue(ORDER_NO_SHIPMENT as any);
    const result = await applyAddShipment(call());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.changed).toBe(true);
    expect(mockShipmentUpsert).toHaveBeenCalledTimes(1);
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: "order-001" },
      data: { fulfillmentStatus: "processing" },
    });
  });

  it("updates when courier/tracking values differ from the existing shipment", async () => {
    mockFindUnique.mockResolvedValue(ORDER_WITH_SHIPMENT as any);
    const result = await applyAddShipment(call({ courier: "Bluedart" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.changed).toBe(true);
    expect(mockShipmentUpsert).toHaveBeenCalledTimes(1);
  });

  it("IDEMPOTENCY: an identical resubmission is a no-op — no write, changed: false", async () => {
    mockFindUnique.mockResolvedValue(ORDER_WITH_SHIPMENT as any);
    const result = await applyAddShipment(
      call({
        courier: "DTDC",
        trackingNumber: "AWB123",
        trackingUrl: "https://track.example.com/AWB123",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.changed).toBe(false);
    expect(mockShipmentUpsert).not.toHaveBeenCalled();
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it("IDEMPOTENCY: repeated identical calls in a row never write more than the necessary once", async () => {
    mockFindUnique.mockResolvedValue(ORDER_NO_SHIPMENT as any);
    const first = await applyAddShipment(call());
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.changed).toBe(true);
    expect(mockShipmentUpsert).toHaveBeenCalledTimes(1);

    // Second identical call — simulate the shipment now existing as it would
    // in the real DB after the first call.
    mockFindUnique.mockResolvedValue(ORDER_WITH_SHIPMENT as any);
    const second = await applyAddShipment(call());
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.changed).toBe(false);
    // Still only the one call from the first invocation.
    expect(mockShipmentUpsert).toHaveBeenCalledTimes(1);
  });

  it("treats a trailing-empty trackingUrl the same as an existing null trackingUrl (no false-positive change)", async () => {
    mockFindUnique.mockResolvedValue({
      ...ORDER_WITH_SHIPMENT,
      shipment: { courier: "DTDC", trackingNumber: "AWB123", trackingUrl: null },
    } as any);
    const result = await applyAddShipment(call({ trackingUrl: null }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.changed).toBe(false);
    expect(mockShipmentUpsert).not.toHaveBeenCalled();
  });
});

describe("applyAddShipment — audit logging (exactly one entry per outcome)", () => {
  it("a successful create logs exactly one shipment.changed audit entry", async () => {
    mockFindUnique.mockResolvedValue(ORDER_NO_SHIPMENT as any);
    await applyAddShipment(call());
    expect(log.info).toHaveBeenCalledTimes(1);
    expect(log.info).toHaveBeenCalledWith(
      "shipment.changed",
      expect.objectContaining({ orderId: "order-001", action: "created", result: "success" }),
    );
    expect(log.warn).not.toHaveBeenCalled();
  });

  it("an identical resubmission (no-op) creates NO new audit entry", async () => {
    mockFindUnique.mockResolvedValue(ORDER_WITH_SHIPMENT as any);
    await applyAddShipment(call());
    expect(log.info).not.toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
  });

  it("an unauthorised attempt logs exactly one rejection, no success entry", async () => {
    await applyAddShipment(call({ actorRole: "inventory_staff" }));
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith(
      "shipment.change_rejected",
      expect.objectContaining({ result: "rejected_unauthorised" }),
    );
    expect(log.info).not.toHaveBeenCalled();
  });
});

describe("applyAddShipment — returned order data for caller-side notification", () => {
  it("returns email/customerName so the caller can decide whether to notify", async () => {
    mockFindUnique.mockResolvedValue(ORDER_NO_SHIPMENT as any);
    const result = await applyAddShipment(call());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.order).toEqual({
        id: "order-001",
        email: "customer@example.com",
        customerName: "Jane Doe",
      });
    }
  });
});
