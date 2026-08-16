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

import { applyMarkCodPaid } from "../../apps/web/lib/applyMarkCodPaid";
import { log } from "../../apps/web/lib/logger";
import { prisma } from "../../apps/web/lib/db";

const mockFindUnique = vi.mocked(prisma.order.findUnique);
const mockUpdate = vi.mocked(prisma.order.update);

// Shorthand: actor params for a COD collection request.
const actor = (role: string, id = "user-001") => ({
  orderId: "order-cod-001",
  actorId: id,
  actorRole: role,
  codPaymentMethod: "cash",
  codUpiRef: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Default: a COD order in cod_pending state — the happy path.
  mockFindUnique.mockResolvedValue({
    id: "order-cod-001",
    status: "cod_pending",
  } as any);
  mockUpdate.mockResolvedValue({} as any);
});

// ── Authorization: allowed roles ──────────────────────────────────────────────

describe("authorization — allowed roles", () => {
  it("owner can mark an eligible COD order as paid", async () => {
    const result = await applyMarkCodPaid(actor("owner"));
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("admin can mark an eligible COD order as paid", async () => {
    const result = await applyMarkCodPaid(actor("admin"));
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });
});

// ── Authorization: rejected roles ─────────────────────────────────────────────

describe("authorization — rejected roles", () => {
  for (const role of [
    "manager",
    "billing_staff",
    "inventory_staff",
    "customer",
    "",
    "superuser",
  ]) {
    it(`${role || "(empty / unauthenticated)"} is rejected without DB query`, async () => {
      const result = await applyMarkCodPaid(actor(role));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("rejected_unauthorised");
      // Fail fast: no DB access for unauthorised requests.
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  }
});

// ── COD eligibility ───────────────────────────────────────────────────────────

describe("COD eligibility — only cod_pending orders are collectible", () => {
  it("non-COD order (status 'pending') is rejected", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "pending",
    } as any);
    const result = await applyMarkCodPaid(actor("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_ineligible_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("already-paid order is rejected", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "paid",
    } as any);
    const result = await applyMarkCodPaid(actor("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_ineligible_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("cancelled order is rejected", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "cancelled",
    } as any);
    const result = await applyMarkCodPaid(actor("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_ineligible_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("expired order is rejected", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "expired",
    } as any);
    const result = await applyMarkCodPaid(actor("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_ineligible_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("failed order is rejected", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "failed",
    } as any);
    const result = await applyMarkCodPaid(actor("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_ineligible_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("unknown status string is rejected", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "refunded",
    } as any);
    const result = await applyMarkCodPaid(actor("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_ineligible_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Order not found ───────────────────────────────────────────────────────────

describe("order not found", () => {
  it("returns order_not_found when order does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await applyMarkCodPaid(actor("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("order_not_found");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── DB write: correct data written ───────────────────────────────────────────

describe("DB write on success", () => {
  it("writes status paid, codPaymentMethod, and codUpiRef on success", async () => {
    const result = await applyMarkCodPaid({
      ...actor("admin"),
      codPaymentMethod: "upi",
      codUpiRef: "UTR123456",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "order-cod-001" },
      data: { status: "paid", codPaymentMethod: "upi", codUpiRef: "UTR123456" },
    });
  });

  it("writes codUpiRef as null when not provided", async () => {
    const result = await applyMarkCodPaid({
      ...actor("admin"),
      codUpiRef: null,
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "order-cod-001" },
      data: { status: "paid", codPaymentMethod: "cash", codUpiRef: null },
    });
  });

  it("fromStatus is captured from the DB before the update", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "cod_pending",
    } as any);
    await applyMarkCodPaid(actor("owner"));
    // Confirm log.info includes fromStatus: "cod_pending" (the DB value, not assumed).
    expect(log.info).toHaveBeenCalledWith(
      "payment.status_changed",
      expect.objectContaining({ fromStatus: "cod_pending", toStatus: "paid" }),
    );
  });
});

// ── Audit logging on success ──────────────────────────────────────────────────

describe("audit logging on success", () => {
  it("calls log.info('payment.status_changed') with correct audit fields", async () => {
    await applyMarkCodPaid({
      orderId: "order-cod-001",
      actorId: "user-owner-001",
      actorRole: "owner",
      codPaymentMethod: "cash",
      codUpiRef: null,
    });
    expect(log.info).toHaveBeenCalledWith(
      "payment.status_changed",
      expect.objectContaining({
        orderId: "order-cod-001",
        actorId: "user-owner-001",
        actorRole: "owner",
        fromStatus: "cod_pending",
        toStatus: "paid",
        source: "cod_collected",
        result: "success",
      }),
    );
  });

  it("audit log on success does NOT contain codUpiRef, password, token, or email", async () => {
    await applyMarkCodPaid({
      ...actor("admin"),
      codUpiRef: "UTR999",
    });
    const [, payload] = (log.info as ReturnType<typeof vi.fn>).mock.calls[0];
    const keys = Object.keys(payload);
    expect(keys).not.toContain("codUpiRef");
    expect(keys).not.toContain("password");
    expect(keys).not.toContain("token");
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("phone");
  });

  it("source field is 'cod_collected', not 'manual_update'", async () => {
    await applyMarkCodPaid(actor("admin"));
    expect(log.info).toHaveBeenCalledWith(
      "payment.status_changed",
      expect.objectContaining({ source: "cod_collected" }),
    );
  });
});

// ── Audit logging on rejection ────────────────────────────────────────────────

describe("audit logging on rejection", () => {
  it("calls log.warn for unauthorised role", async () => {
    await applyMarkCodPaid(actor("manager"));
    expect(log.warn).toHaveBeenCalledWith(
      "payment.status_change_rejected",
      expect.objectContaining({
        result: "rejected_unauthorised",
        actorRole: "manager",
        source: "cod_collected",
      }),
    );
  });

  it("calls log.error for unauthorised role", async () => {
    await applyMarkCodPaid(actor("billing_staff"));
    expect(log.error).toHaveBeenCalledWith(
      "payment.cod_collection.unauthorised",
      expect.objectContaining({ error: "Insufficient role" }),
    );
  });

  it("calls log.warn for ineligible order with real fromStatus", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "cancelled",
    } as any);
    await applyMarkCodPaid(actor("admin"));
    expect(log.warn).toHaveBeenCalledWith(
      "payment.status_change_rejected",
      expect.objectContaining({
        result: "rejected_ineligible_order",
        fromStatus: "cancelled",
        toStatus: "paid",
        source: "cod_collected",
      }),
    );
  });

  it("calls log.warn for already-paid order", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-cod-001",
      status: "paid",
    } as any);
    await applyMarkCodPaid(actor("admin"));
    expect(log.warn).toHaveBeenCalledWith(
      "payment.status_change_rejected",
      expect.objectContaining({
        result: "rejected_ineligible_order",
        fromStatus: "paid",
      }),
    );
  });

  it("does not call log.info on any rejection", async () => {
    await applyMarkCodPaid(actor("inventory_staff"));
    expect(log.info).not.toHaveBeenCalled();
  });
});

// ── No DB write on rejection ──────────────────────────────────────────────────

describe("no DB write on rejection", () => {
  it("update is never called for unauthorised role", async () => {
    await applyMarkCodPaid(actor("manager"));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("update is never called for ineligible order status", async () => {
    for (const status of [
      "pending",
      "paid",
      "cancelled",
      "expired",
      "failed",
    ]) {
      vi.clearAllMocks();
      mockFindUnique.mockResolvedValue({ id: "order-cod-001", status } as any);
      await applyMarkCodPaid(actor("admin"));
      expect(mockUpdate).not.toHaveBeenCalled();
    }
  });
});

// ── Existing valid COD behavior ───────────────────────────────────────────────

describe("existing valid COD behavior preserved", () => {
  it("full cash collection flow completes and returns ok", async () => {
    const result = await applyMarkCodPaid({
      orderId: "order-cod-001",
      actorId: "user-001",
      actorRole: "owner",
      codPaymentMethod: "cash",
      codUpiRef: null,
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("full UPI collection flow completes and returns ok", async () => {
    const result = await applyMarkCodPaid({
      orderId: "order-cod-001",
      actorId: "user-001",
      actorRole: "admin",
      codPaymentMethod: "upi",
      codUpiRef: "UTR20260816",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "paid" }),
      }),
    );
  });

  it("success path calls findUnique once and update once", async () => {
    await applyMarkCodPaid(actor("owner"));
    expect(mockFindUnique).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledOnce();
  });
});
