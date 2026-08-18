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
  },
}));

import { applyFulfillmentStatusChange } from "../../apps/web/lib/applyFulfillmentStatusChange";
import { log } from "../../apps/web/lib/logger";
import { prisma } from "../../apps/web/lib/db";

const mockFindUnique = vi.mocked(prisma.order.findUnique);
const mockUpdate = vi.mocked(prisma.order.update);

// Shorthand: build a complete call param set. Defaults to actorType "staff"
// (the function's own default), matching every pre-Phase-5 caller.
const call = (
  role: string,
  newStatus = "processing",
  id = "user-001",
  actorType?: "staff" | "customer",
) => ({
  orderId: "order-001",
  newStatus,
  actorId: id,
  actorRole: role,
  ...(actorType ? { actorType } : {}),
});

// Default order shape: pending, in-store (never gated by the courier/shipment
// rule), no shipment. Individual tests override orderChannel/courierLabel/
// shipment to exercise the Phase 5 prerequisite.
function orderFixture(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: "order-001",
    fulfillmentStatus: "pending",
    orderChannel: "in_store",
    courierLabel: null,
    shipment: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindUnique.mockResolvedValue(orderFixture() as any);
  mockUpdate.mockResolvedValue({} as any);
});

// ── Authorization — allowed roles (staff) ─────────────────────────────────────

describe("authorization — allowed staff roles", () => {
  for (const role of ["owner", "admin", "manager", "billing_staff"]) {
    it(`${role} can update fulfillment status`, async () => {
      const result = await applyFulfillmentStatusChange(call(role));
      expect(result.ok).toBe(true);
      expect(mockUpdate).toHaveBeenCalledOnce();
    });
  }
});

// ── Authorization — rejected roles ────────────────────────────────────────────

describe("authorization — rejected staff roles", () => {
  for (const role of [
    "inventory_staff",
    "customer",
    "",
    "superuser",
    "guest",
  ]) {
    it(`${role || "(empty / unauthenticated)"} is rejected without DB query`, async () => {
      const result = await applyFulfillmentStatusChange(call(role));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("rejected_unauthorised");
      // Fail fast: no DB access for unauthorised requests.
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  }
});

// ── Fulfillment status validation ─────────────────────────────────────────────

describe("fulfillment status validation — valid enum values, precondition matched to transition", () => {
  it("accepts 'pending' (no-op)", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }) as any);
    const result = await applyFulfillmentStatusChange(call("admin", "pending"));
    expect(result.ok).toBe(true);
  });

  it("accepts 'processing' from pending", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }) as any);
    const result = await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(result.ok).toBe(true);
  });

  it("accepts 'completed' from processing", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "processing" }) as any);
    const result = await applyFulfillmentStatusChange(call("admin", "completed"));
    expect(result.ok).toBe(true);
  });

  it("accepts 'cancelled' from pending", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }) as any);
    const result = await applyFulfillmentStatusChange(call("admin", "cancelled"));
    expect(result.ok).toBe(true);
  });
});

describe("fulfillment status validation — invalid values", () => {
  it("rejects 'delivered' (dead-code UI value, not in FULFILLMENT_STATUSES)", async () => {
    const result = await applyFulfillmentStatusChange(
      call("admin", "delivered"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects 'paid' (payment status, not a fulfillment status)", async () => {
    const result = await applyFulfillmentStatusChange(call("admin", "paid"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
  });

  it("rejects empty string", async () => {
    const result = await applyFulfillmentStatusChange(call("admin", ""));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
  });

  it("rejects unknown string", async () => {
    const result = await applyFulfillmentStatusChange(call("admin", "shipped"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
  });

  it("rejects SQL injection attempt", async () => {
    const result = await applyFulfillmentStatusChange(
      call("admin", "pending'; DROP TABLE orders; --"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects uppercase (case-sensitive)", async () => {
    const result = await applyFulfillmentStatusChange(
      call("admin", "PROCESSING"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
  });

  it("enum validation runs before DB fetch", async () => {
    await applyFulfillmentStatusChange(call("admin", "delivered"));
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

// ── Payment status untouched ──────────────────────────────────────────────────

describe("payment status unchanged", () => {
  it("update only writes fulfillmentStatus — payment status field never touched", async () => {
    await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "order-001" },
      data: { fulfillmentStatus: "processing" },
    });
    const [{ data }] = (mockUpdate as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(Object.keys(data)).not.toContain("status");
  });

  it("does not include codPaymentMethod or any payment field in update", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "processing" }) as any);
    await applyFulfillmentStatusChange(call("owner", "completed"));
    const [{ data }] = (mockUpdate as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data).toEqual({ fulfillmentStatus: "completed" });
  });
});

// ── Order not found ───────────────────────────────────────────────────────────

describe("order not found", () => {
  it("returns order_not_found when order does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await applyFulfillmentStatusChange(call("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("order_not_found");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Current status captured before update ─────────────────────────────────────

describe("current status captured before update", () => {
  it("fromStatus in success log is DB value, not assumed", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }) as any);
    await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(log.info).toHaveBeenCalledWith(
      "fulfillment.status_changed",
      expect.objectContaining({
        fromStatus: "pending",
        toStatus: "processing",
      }),
    );
  });

  it("findUnique is called before update to capture fromStatus", async () => {
    const callOrder: string[] = [];
    mockFindUnique.mockImplementation(async () => {
      callOrder.push("findUnique");
      return orderFixture({ fulfillmentStatus: "pending" });
    });
    mockUpdate.mockImplementation(async () => {
      callOrder.push("update");
      return {};
    });
    await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(callOrder).toEqual(["findUnique", "update"]);
  });
});

// ── No-op guard ───────────────────────────────────────────────────────────────

describe("no-op guard", () => {
  it("returns ok without DB write when status is unchanged", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "processing" }) as any);
    const result = await applyFulfillmentStatusChange(
      call("admin", "processing"),
    );
    expect(result.ok).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("no-op guard runs before the matrix check — same-status resubmission never hits rejected_invalid_transition", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "completed" }) as any);
    const result = await applyFulfillmentStatusChange(call("admin", "completed"));
    expect(result.ok).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Audit logging on success ──────────────────────────────────────────────────

describe("audit logging on success", () => {
  it("calls log.info('fulfillment.status_changed') with all required fields", async () => {
    await applyFulfillmentStatusChange({
      orderId: "order-001",
      newStatus: "processing",
      actorId: "user-owner-001",
      actorRole: "owner",
    });
    expect(log.info).toHaveBeenCalledWith(
      "fulfillment.status_changed",
      expect.objectContaining({
        orderId: "order-001",
        actorId: "user-owner-001",
        actorRole: "owner",
        fromStatus: "pending",
        toStatus: "processing",
        result: "success",
      }),
    );
  });

  it("audit log does not contain email, phone, password, token", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "processing" }) as any);
    await applyFulfillmentStatusChange(call("admin", "completed"));
    const [, payload] = (log.info as ReturnType<typeof vi.fn>).mock.calls[0];
    const keys = Object.keys(payload);
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("phone");
    expect(keys).not.toContain("password");
    expect(keys).not.toContain("token");
  });

  it("does not call log.info on rejection", async () => {
    await applyFulfillmentStatusChange(call("customer"));
    expect(log.info).not.toHaveBeenCalled();
  });
});

// ── Audit logging on rejection ────────────────────────────────────────────────

describe("audit logging on rejection", () => {
  it("calls log.warn('fulfillment.status_change_rejected') for unauthorised role", async () => {
    await applyFulfillmentStatusChange(call("customer", "processing"));
    expect(log.warn).toHaveBeenCalledWith(
      "fulfillment.status_change_rejected",
      expect.objectContaining({
        result: "rejected_unauthorised",
        actorRole: "customer",
      }),
    );
  });

  it("calls log.error for unauthorised role (inventory_staff)", async () => {
    await applyFulfillmentStatusChange(call("inventory_staff"));
    expect(log.error).toHaveBeenCalledWith(
      "fulfillment.status_change.unauthorised",
      expect.objectContaining({ error: "Insufficient role" }),
    );
  });

  it("calls log.error for unauthenticated (empty role)", async () => {
    await applyFulfillmentStatusChange(call(""));
    expect(log.error).toHaveBeenCalledWith(
      "fulfillment.status_change.unauthorised",
      expect.objectContaining({ error: "Insufficient role" }),
    );
  });

  it("calls log.warn('fulfillment.status_change_rejected') for invalid status", async () => {
    await applyFulfillmentStatusChange(call("admin", "delivered"));
    expect(log.warn).toHaveBeenCalledWith(
      "fulfillment.status_change_rejected",
      expect.objectContaining({
        result: "rejected_invalid_status",
        toStatus: "delivered",
      }),
    );
  });

  it("calls log.warn with rejected_invalid_transition for a matrix violation", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "completed" }) as any);
    await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(log.warn).toHaveBeenCalledWith(
      "fulfillment.status_change_rejected",
      expect.objectContaining({ result: "rejected_invalid_transition" }),
    );
  });

  it("calls log.warn with rejected_missing_shipment for the courier gate", async () => {
    mockFindUnique.mockResolvedValue(
      orderFixture({
        fulfillmentStatus: "pending",
        orderChannel: "online",
        courierLabel: "Delhivery",
        shipment: null,
      }) as any,
    );
    await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(log.warn).toHaveBeenCalledWith(
      "fulfillment.status_change_rejected",
      expect.objectContaining({ result: "rejected_missing_shipment" }),
    );
  });

  it("calls log.warn with rejected_customer_scope for an out-of-scope customer request", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }) as any);
    await applyFulfillmentStatusChange(
      call("customer", "processing", "cust@example.com", "customer"),
    );
    expect(log.warn).toHaveBeenCalledWith(
      "fulfillment.status_change_rejected",
      expect.objectContaining({ result: "rejected_customer_scope", actorType: "customer" }),
    );
  });
});

// ── No DB write on rejection ──────────────────────────────────────────────────

describe("no DB write on rejection", () => {
  it("update not called for unauthorised role", async () => {
    await applyFulfillmentStatusChange(call("customer"));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("update not called for invalid status", async () => {
    await applyFulfillmentStatusChange(call("admin", "delivered"));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("update not called for a matrix violation", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "completed" }) as any);
    await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("update not called for a missing-shipment rejection", async () => {
    mockFindUnique.mockResolvedValue(
      orderFixture({
        fulfillmentStatus: "pending",
        orderChannel: "online",
        courierLabel: "DTDC",
        shipment: null,
      }) as any,
    );
    await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Final transition matrix — every (from, to) pair ───────────────────────────
// completed and cancelled are terminal; pending->completed and
// processing->pending are rejected (Phase 5 decisions 1-3).

describe("final transition matrix — staff actor", () => {
  const STATUSES = ["pending", "processing", "completed", "cancelled"] as const;
  const ALLOWED = new Set([
    "pending->processing",
    "pending->cancelled",
    "processing->completed",
    "processing->cancelled",
  ]);

  for (const from of STATUSES) {
    for (const to of STATUSES) {
      if (from === to) continue; // no-op guard, covered separately
      const key = `${from}->${to}`;
      const shouldAllow = ALLOWED.has(key);

      it(`${shouldAllow ? "allows" : "rejects"} ${key}`, async () => {
        mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: from }) as any);
        const result = await applyFulfillmentStatusChange(call("admin", to));
        expect(result.ok).toBe(shouldAllow);
        if (!shouldAllow && !result.ok) {
          expect(result.reason).toBe("rejected_invalid_transition");
        }
        if (shouldAllow) {
          expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: "order-001" },
            data: { fulfillmentStatus: to },
          });
        } else {
          expect(mockUpdate).not.toHaveBeenCalled();
        }
      });
    }
  }
});

// ── Courier/shipment prerequisite (pending -> processing only) ───────────────

describe("courier/shipment prerequisite on pending -> processing", () => {
  it("in-store: allowed without a shipment or courier data", async () => {
    mockFindUnique.mockResolvedValue(
      orderFixture({ fulfillmentStatus: "pending", orderChannel: "in_store", courierLabel: null, shipment: null }) as any,
    );
    const result = await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(result.ok).toBe(true);
  });

  it("online, no courier snapshot: allowed without a shipment", async () => {
    mockFindUnique.mockResolvedValue(
      orderFixture({ fulfillmentStatus: "pending", orderChannel: "online", courierLabel: null, shipment: null }) as any,
    );
    const result = await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(result.ok).toBe(true);
  });

  it("online with a courier snapshot and no shipment: rejected_missing_shipment", async () => {
    mockFindUnique.mockResolvedValue(
      orderFixture({ fulfillmentStatus: "pending", orderChannel: "online", courierLabel: "Blue Dart", shipment: null }) as any,
    );
    const result = await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_missing_shipment");
  });

  it("online with a courier snapshot AND an existing shipment: allowed (prerequisite already satisfied)", async () => {
    mockFindUnique.mockResolvedValue(
      orderFixture({
        fulfillmentStatus: "pending",
        orderChannel: "online",
        courierLabel: "Blue Dart",
        shipment: { id: "ship-001" },
      }) as any,
    );
    const result = await applyFulfillmentStatusChange(call("admin", "processing"));
    expect(result.ok).toBe(true);
  });

  it("courier/shipment gate does not apply to any other transition (e.g. pending -> cancelled)", async () => {
    mockFindUnique.mockResolvedValue(
      orderFixture({ fulfillmentStatus: "pending", orderChannel: "online", courierLabel: "DTDC", shipment: null }) as any,
    );
    const result = await applyFulfillmentStatusChange(call("admin", "cancelled"));
    expect(result.ok).toBe(true);
  });
});

// ── Customer actor scope ──────────────────────────────────────────────────────

describe("customer actor scope", () => {
  it("customer: pending -> cancelled is allowed", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }) as any);
    const result = await applyFulfillmentStatusChange(
      call("customer", "cancelled", "cust@example.com", "customer"),
    );
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "order-001" },
      data: { fulfillmentStatus: "cancelled" },
    });
  });

  it("customer: processing -> cancelled is rejected (decision 8b) even though staff may do it (8a)", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "processing" }) as any);
    const result = await applyFulfillmentStatusChange(
      call("customer", "cancelled", "cust@example.com", "customer"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_customer_scope");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("customer: any newStatus other than cancelled is rejected regardless of fromStatus", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }) as any);
    const result = await applyFulfillmentStatusChange(
      call("customer", "processing", "cust@example.com", "customer"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_customer_scope");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("customer actor type does not use FULFILLMENT_ALLOWED_ROLES — actorRole 'customer' is not itself a rejection reason", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }) as any);
    const result = await applyFulfillmentStatusChange(
      call("customer", "cancelled", "cust@example.com", "customer"),
    );
    // Must succeed via customer scope, not fail via the staff role gate.
    expect(result.ok).toBe(true);
  });

  it("staff actor type (default) is unaffected by the customer-scope restriction", async () => {
    mockFindUnique.mockResolvedValue(orderFixture({ fulfillmentStatus: "processing" }) as any);
    const result = await applyFulfillmentStatusChange(call("admin", "cancelled"));
    expect(result.ok).toBe(true);
  });
});

// ── tx parameter — atomicity support ──────────────────────────────────────────

describe("optional tx parameter", () => {
  it("uses the provided tx client instead of the top-level prisma client", async () => {
    const txFindUnique = vi.fn().mockResolvedValue(orderFixture({ fulfillmentStatus: "pending" }));
    const txUpdate = vi.fn().mockResolvedValue({});
    const tx = { order: { findUnique: txFindUnique, update: txUpdate } } as any;

    const result = await applyFulfillmentStatusChange({
      orderId: "order-001",
      newStatus: "cancelled",
      actorId: "cust@example.com",
      actorRole: "customer",
      actorType: "customer",
      tx,
    });

    expect(result.ok).toBe(true);
    expect(txFindUnique).toHaveBeenCalledOnce();
    expect(txUpdate).toHaveBeenCalledOnce();
    // The top-level (non-tx) mocked prisma client must not have been touched.
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Both implementations share the same library ───────────────────────────────
// The orders-list page and order-detail page both call applyFulfillmentStatusChange
// with actorType: "staff"; /api/orders/cancel calls it with actorType: "customer".
// Unit tests above cover the shared logic for all three callers.
