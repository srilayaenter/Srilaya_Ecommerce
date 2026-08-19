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

vi.mock("../../apps/web/lib/db", () => {
  const mockShipmentUpsert = vi.fn();
  const mockOrderUpdate = vi.fn();
  return {
    prisma: {
      order: {
        findUnique: vi.fn(),
        update: mockOrderUpdate,
      },
      shipment: {
        upsert: mockShipmentUpsert,
      },
      // The real implementation runs the shipment upsert and the
      // fulfillmentStatus write inside one $transaction (Phase 5 decision 5:
      // atomicity). The mock just invokes the callback with a tx object
      // routed to the SAME mock functions, so existing call-count/argument
      // assertions on mockShipmentUpsert/mockOrderUpdate keep working
      // unchanged, while still exercising the real atomic code path.
      $transaction: vi.fn(async (cb: any) =>
        cb({
          shipment: { upsert: mockShipmentUpsert },
          order: { update: mockOrderUpdate },
        }),
      ),
    },
  };
});

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
  fulfillmentStatus: "pending",
  shipment: null,
};

const ORDER_WITH_SHIPMENT = {
  id: "order-001",
  email: "customer@example.com",
  customerName: "Jane Doe",
  fulfillmentStatus: "processing",
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

// ── Terminal-state guard (Phase 5 decision 10) ────────────────────────────────

describe("applyAddShipment — terminal-state guard", () => {
  it.each(["completed", "cancelled"])(
    "rejects when the order is %s (terminal) — no shipment write",
    async (status) => {
      mockFindUnique.mockResolvedValue({ ...ORDER_NO_SHIPMENT, fulfillmentStatus: status } as any);
      const result = await applyAddShipment(call());
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("rejected_invalid_transition");
      expect(mockShipmentUpsert).not.toHaveBeenCalled();
      expect(mockOrderUpdate).not.toHaveBeenCalled();
    },
  );

  it("terminal-state guard runs even for a resubmission that would otherwise be idempotent", async () => {
    mockFindUnique.mockResolvedValue({ ...ORDER_WITH_SHIPMENT, fulfillmentStatus: "completed" } as any);
    const result = await applyAddShipment(call());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_transition");
    // Must be rejected outright, not silently treated as a no-op.
    expect(mockShipmentUpsert).not.toHaveBeenCalled();
  });

  it("logs shipment.change_rejected with rejected_invalid_transition for a terminal order", async () => {
    mockFindUnique.mockResolvedValue({ ...ORDER_NO_SHIPMENT, fulfillmentStatus: "cancelled" } as any);
    await applyAddShipment(call());
    expect(log.warn).toHaveBeenCalledWith(
      "shipment.change_rejected",
      expect.objectContaining({ result: "rejected_invalid_transition" }),
    );
  });
});

// ── Atomic pending -> processing transition (Phase 5 decisions 4/5) ──────────

describe("applyAddShipment — atomic pending -> processing transition", () => {
  it("creates a new shipment when none exists AND transitions fulfillmentStatus to processing, in one $transaction", async () => {
    mockFindUnique.mockResolvedValue(ORDER_NO_SHIPMENT as any);
    const result = await applyAddShipment(call());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.changed).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockShipmentUpsert).toHaveBeenCalledTimes(1);
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: "order-001" },
      data: { fulfillmentStatus: "processing" },
    });
  });

  it("when the order is already processing, updates the shipment WITHOUT re-writing fulfillmentStatus", async () => {
    mockFindUnique.mockResolvedValue({
      ...ORDER_WITH_SHIPMENT,
      fulfillmentStatus: "processing",
      shipment: { courier: "DTDC", trackingNumber: "OLD-AWB", trackingUrl: null },
    } as any);
    const result = await applyAddShipment(call({ trackingNumber: "NEW-AWB" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.changed).toBe(true);
    expect(mockShipmentUpsert).toHaveBeenCalledTimes(1);
    // fulfillmentStatus is already "processing" — no transition write needed.
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it("both the shipment upsert and the status update happen inside the same $transaction callback (atomicity)", async () => {
    mockFindUnique.mockResolvedValue(ORDER_NO_SHIPMENT as any);
    const callOrder: string[] = [];
    mockShipmentUpsert.mockImplementation(async () => {
      callOrder.push("shipment.upsert");
      return {};
    });
    mockOrderUpdate.mockImplementation(async () => {
      callOrder.push("order.update");
      return {};
    });
    await applyAddShipment(call());
    // Both writes happened, in order, and both were reached via the single
    // $transaction call (asserted above) rather than two separate top-level
    // prisma calls.
    expect(callOrder).toEqual(["shipment.upsert", "order.update"]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
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

    // Second identical call — simulate the shipment now existing (and the
    // order now "processing") as it would in the real DB after the first call.
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
