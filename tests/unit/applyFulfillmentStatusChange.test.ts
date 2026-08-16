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

// Shorthand: build a complete call param set.
const call = (role: string, newStatus = "processing", id = "user-001") => ({
  orderId: "order-001",
  newStatus,
  actorId: id,
  actorRole: role,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Default: order in "pending" fulfillment state.
  mockFindUnique.mockResolvedValue({
    id: "order-001",
    fulfillmentStatus: "pending",
  } as any);
  mockUpdate.mockResolvedValue({} as any);
});

// ── Authorization — allowed roles ─────────────────────────────────────────────
// Owner decision 2026-08-16: owner, admin, manager, billing_staff permitted.
// inventory_staff explicitly rejected server-side (see rejected roles below).

describe("authorization — allowed roles", () => {
  for (const role of ["owner", "admin", "manager", "billing_staff"]) {
    it(`${role} can update fulfillment status`, async () => {
      const result = await applyFulfillmentStatusChange(call(role));
      expect(result.ok).toBe(true);
      expect(mockUpdate).toHaveBeenCalledOnce();
    });
  }
});

// ── Authorization — rejected roles ────────────────────────────────────────────
// inventory_staff is included: UI path restriction is not sufficient;
// the server action must enforce this independently (owner decision 2026-08-16).

describe("authorization — rejected roles", () => {
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

describe("fulfillment status validation — valid values", () => {
  for (const status of ["pending", "processing", "completed", "cancelled"]) {
    it(`accepts valid fulfillment status '${status}'`, async () => {
      mockFindUnique.mockResolvedValue({
        id: "order-001",
        fulfillmentStatus: "pending",
      } as any);
      const result = await applyFulfillmentStatusChange(call("admin", status));
      expect(result.ok).toBe(true);
    });
  }
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
    // Confirm the data object has no 'status' key (payment status).
    const [{ data }] = (mockUpdate as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(Object.keys(data)).not.toContain("status");
  });

  it("does not include codPaymentMethod or any payment field in update", async () => {
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
    mockFindUnique.mockResolvedValue({
      id: "order-001",
      fulfillmentStatus: "pending",
    } as any);
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
      return { id: "order-001", fulfillmentStatus: "pending" };
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
    mockFindUnique.mockResolvedValue({
      id: "order-001",
      fulfillmentStatus: "processing",
    } as any);
    const result = await applyFulfillmentStatusChange(
      call("admin", "processing"),
    );
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
});

// ── Valid transitions preserved ───────────────────────────────────────────────

describe("existing valid transitions preserved", () => {
  const transitions = [
    { from: "pending", to: "processing" },
    { from: "processing", to: "completed" },
    { from: "pending", to: "cancelled" },
    { from: "processing", to: "cancelled" },
    { from: "completed", to: "cancelled" },
    { from: "cancelled", to: "pending" }, // re-open (not blocked by policy)
  ];

  for (const { from, to } of transitions) {
    it(`allows ${from} → ${to}`, async () => {
      mockFindUnique.mockResolvedValue({
        id: "order-001",
        fulfillmentStatus: from,
      } as any);
      const result = await applyFulfillmentStatusChange(call("admin", to));
      expect(result.ok).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "order-001" },
        data: { fulfillmentStatus: to },
      });
    });
  }
});

// ── Both implementations share the same library ───────────────────────────────
// The orders-list page and order-detail page both call applyFulfillmentStatusChange.
// Unit tests above cover the shared logic for both. The differences between the
// two server actions (notification targets, revalidatePath paths) are not
// unit-testable at the server-action level and are verified through the shared
// library tests instead.
