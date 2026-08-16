import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-axiom before any logger import so the Logger singleton gets
// mocked methods instead of live Axiom calls.
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

import { applyPaymentStatusChange } from "../../apps/web/lib/updatePaymentStatus";
import { log } from "../../apps/web/lib/logger";
import { prisma } from "../../apps/web/lib/db";

const mockFindUnique = vi.mocked(prisma.order.findUnique);
const mockUpdate = vi.mocked(prisma.order.update);

// Shorthand to DRY up actor params.
const actor = (role: string, id = "user-001") => ({
  orderId: "order-abc",
  newStatus: "paid",
  actorId: id,
  actorRole: role,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Default: order exists with status "pending".
  mockFindUnique.mockResolvedValue({
    id: "order-abc",
    status: "pending",
  } as any);
  mockUpdate.mockResolvedValue({} as any);
});

// ── Authorization: allowed roles ──────────────────────────────────────────────

describe("authorization — allowed roles", () => {
  it("owner can change payment status", async () => {
    const result = await applyPaymentStatusChange(actor("owner"));
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("admin can change payment status", async () => {
    const result = await applyPaymentStatusChange(actor("admin"));
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
    it(`${role || "(empty string)"} is rejected`, async () => {
      const result = await applyPaymentStatusChange(actor(role));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("rejected_unauthorised");
      expect(mockUpdate).not.toHaveBeenCalled();
      // DB must not be queried for the order either — fail fast.
      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  }
});

// ── Enum validation ───────────────────────────────────────────────────────────

describe("enum validation", () => {
  const validStatuses = [
    "pending",
    "cod_pending",
    "paid",
    "failed",
    "cancelled",
  ] as const;

  for (const status of validStatuses) {
    it(`accepts valid writable status '${status}'`, async () => {
      mockFindUnique.mockResolvedValue({
        id: "order-abc",
        status: "pending",
      } as any);
      const result = await applyPaymentStatusChange({
        ...actor("admin"),
        newStatus: status,
      });
      // Either ok (transition valid) or rejected_cancelled_order if current===cancelled.
      // For this test current is "pending", so any valid status is accepted.
      expect(result.ok).toBe(true);
    });
  }

  it("rejects 'expired' (cron-only, not admin-writable)", async () => {
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "expired",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects 'cod_paid' (legacy read alias, never written)", async () => {
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "cod_paid",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects unknown status 'refunded'", async () => {
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "refunded",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects empty string", async () => {
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
  });

  it("rejects SQL injection attempt", async () => {
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "paid'; DROP TABLE orders; --",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_status");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // Enum validation must run before DB fetch — rejected values must not
  // reach the database even for authorised roles.
  it("does not call findUnique when status is invalid", async () => {
    await applyPaymentStatusChange({ ...actor("admin"), newStatus: "expired" });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

// ── Old-status guard ──────────────────────────────────────────────────────────

describe("old-status guard", () => {
  it("rejects cancelled → paid", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "cancelled",
    } as any);
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "paid",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_cancelled_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects cancelled → pending", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "cancelled",
    } as any);
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "pending",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_cancelled_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects cancelled → failed", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "cancelled",
    } as any);
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "failed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_cancelled_order");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("allows pending → paid (standard transition)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "pending",
    } as any);
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "paid",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("allows cod_pending → paid (COD collection via detail page)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "cod_pending",
    } as any);
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "paid",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("allows paid → cancelled", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "paid",
    } as any);
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "cancelled",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("allows failed → pending (reset for retry)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "failed",
    } as any);
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "pending",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("no-op when current status equals new status — returns ok without DB write", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "paid",
    } as any);
    const result = await applyPaymentStatusChange({
      ...actor("admin"),
      newStatus: "paid",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Order not found ───────────────────────────────────────────────────────────

describe("order not found", () => {
  it("returns order_not_found when order does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await applyPaymentStatusChange(actor("admin"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("order_not_found");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Audit logging on success ──────────────────────────────────────────────────

describe("audit logging on success", () => {
  it("calls log.info('payment.status_changed') with correct audit fields", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "pending",
    } as any);
    await applyPaymentStatusChange({
      orderId: "order-abc",
      newStatus: "paid",
      actorId: "user-owner-001",
      actorRole: "owner",
    });
    expect(log.info).toHaveBeenCalledWith(
      "payment.status_changed",
      expect.objectContaining({
        orderId: "order-abc",
        actorId: "user-owner-001",
        actorRole: "owner",
        fromStatus: "pending",
        toStatus: "paid",
        source: "manual_update",
        result: "success",
      }),
    );
  });

  it("audit log on success does NOT contain password, token, secret, email, phone", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "pending",
    } as any);
    await applyPaymentStatusChange(actor("admin"));
    const [, payload] = (log.info as ReturnType<typeof vi.fn>).mock.calls[0];
    const keys = Object.keys(payload);
    expect(keys).not.toContain("password");
    expect(keys).not.toContain("token");
    expect(keys).not.toContain("secret");
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("phone");
    expect(keys).not.toContain("codUpiRef");
  });

  it("DB update uses the validated status value", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "pending",
    } as any);
    await applyPaymentStatusChange({ ...actor("admin"), newStatus: "failed" });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "order-abc" },
      data: { status: "failed" },
    });
  });
});

// ── Audit logging on rejection ────────────────────────────────────────────────

describe("audit logging on rejection", () => {
  it("calls log.warn('payment.status_change_rejected') for unauthorised role", async () => {
    await applyPaymentStatusChange(actor("manager"));
    expect(log.warn).toHaveBeenCalledWith(
      "payment.status_change_rejected",
      expect.objectContaining({
        result: "rejected_unauthorised",
        actorRole: "manager",
      }),
    );
  });

  it("calls log.warn for rejected_invalid_status", async () => {
    await applyPaymentStatusChange({ ...actor("admin"), newStatus: "expired" });
    expect(log.warn).toHaveBeenCalledWith(
      "payment.status_change_rejected",
      expect.objectContaining({ result: "rejected_invalid_status" }),
    );
  });

  it("calls log.warn for rejected_cancelled_order with real fromStatus", async () => {
    mockFindUnique.mockResolvedValue({
      id: "order-abc",
      status: "cancelled",
    } as any);
    await applyPaymentStatusChange({ ...actor("admin"), newStatus: "paid" });
    expect(log.warn).toHaveBeenCalledWith(
      "payment.status_change_rejected",
      expect.objectContaining({
        result: "rejected_cancelled_order",
        fromStatus: "cancelled",
        toStatus: "paid",
      }),
    );
  });

  it("calls log.error for unauthorised role attempt", async () => {
    await applyPaymentStatusChange(actor("manager"));
    expect(log.error).toHaveBeenCalledWith(
      "payment.status_change.unauthorised",
      expect.objectContaining({ error: "Insufficient role" }),
    );
  });

  it("does not call log.info on any rejection", async () => {
    await applyPaymentStatusChange(actor("billing_staff"));
    expect(log.info).not.toHaveBeenCalled();
  });
});

// ── Write guard: no write on rejection ───────────────────────────────────────

describe("no DB write on rejection", () => {
  it("update is never called for any rejected attempt", async () => {
    const rejectionCases = [
      { ...actor("manager"), newStatus: "paid" },
      { ...actor("admin"), newStatus: "expired" },
      { ...actor("admin"), newStatus: "cod_paid" },
      { ...actor("admin"), newStatus: "refunded" },
    ];

    // cancelled order case
    mockFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: "order-abc", status: "cancelled" } as any);

    for (const params of rejectionCases) {
      vi.clearAllMocks();
      mockFindUnique.mockResolvedValue({
        id: "order-abc",
        status: "cancelled",
      } as any);
      const result = await applyPaymentStatusChange(params);
      // Role check and enum check don't query DB, so findUnique may or may not be called.
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(result.ok).toBe(false);
    }
  });
});
