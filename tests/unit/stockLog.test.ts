import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    stockLog: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { logStockChange, logStockChanges } from "../../apps/web/lib/stockLog";
import { prisma } from "../../apps/web/lib/db";

const mockPrisma = prisma as {
  stockLog: {
    create: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── logStockChange ────────────────────────────────────────────────────────────

describe("logStockChange", () => {
  const entry = {
    variantId: "var-001",
    sku: "NAT-001-500",
    delta: -2,
    reason: "order" as const,
    note: "Order CLXYZ000",
    userId: "user-abc",
  };

  it("calls prisma.stockLog.create with the correct entry", async () => {
    mockPrisma.stockLog.create.mockResolvedValue({});
    await logStockChange(entry);
    expect(mockPrisma.stockLog.create).toHaveBeenCalledWith({ data: entry });
  });

  it("calls create exactly once", async () => {
    mockPrisma.stockLog.create.mockResolvedValue({});
    await logStockChange(entry);
    expect(mockPrisma.stockLog.create).toHaveBeenCalledTimes(1);
  });

  it("silently swallows errors (does not throw)", async () => {
    mockPrisma.stockLog.create.mockRejectedValue(new Error("DB error"));
    await expect(logStockChange(entry)).resolves.toBeUndefined();
  });

  it("works with optional fields omitted", async () => {
    mockPrisma.stockLog.create.mockResolvedValue({});
    const minimal = { variantId: "var-002", sku: "NAT-002-1000", delta: 10, reason: "po_receive" as const };
    await logStockChange(minimal);
    expect(mockPrisma.stockLog.create).toHaveBeenCalledWith({ data: minimal });
  });

  it("accepts all valid reason values", async () => {
    mockPrisma.stockLog.create.mockResolvedValue({});
    const reasons = ["order", "offline_order", "return_restock", "csv_import", "manual_edit", "po_receive"] as const;
    for (const reason of reasons) {
      await logStockChange({ ...entry, reason });
    }
    expect(mockPrisma.stockLog.create).toHaveBeenCalledTimes(reasons.length);
  });
});

// ── logStockChanges ───────────────────────────────────────────────────────────

describe("logStockChanges", () => {
  const entries = [
    { variantId: "var-001", sku: "NAT-001-500", delta: -1, reason: "order" as const },
    { variantId: "var-002", sku: "NAT-002-1000", delta: -2, reason: "order" as const },
  ];

  it("calls prisma.stockLog.createMany with all entries", async () => {
    mockPrisma.stockLog.createMany.mockResolvedValue({ count: 2 });
    await logStockChanges(entries);
    expect(mockPrisma.stockLog.createMany).toHaveBeenCalledWith({ data: entries });
  });

  it("calls createMany exactly once regardless of entry count", async () => {
    mockPrisma.stockLog.createMany.mockResolvedValue({ count: 2 });
    await logStockChanges(entries);
    expect(mockPrisma.stockLog.createMany).toHaveBeenCalledTimes(1);
  });

  it("does NOT call createMany when entries array is empty", async () => {
    await logStockChanges([]);
    expect(mockPrisma.stockLog.createMany).not.toHaveBeenCalled();
  });

  it("silently swallows errors (does not throw)", async () => {
    mockPrisma.stockLog.createMany.mockRejectedValue(new Error("DB error"));
    await expect(logStockChanges(entries)).resolves.toBeUndefined();
  });

  it("works with a single entry", async () => {
    mockPrisma.stockLog.createMany.mockResolvedValue({ count: 1 });
    await logStockChanges([entries[0]]);
    expect(mockPrisma.stockLog.createMany).toHaveBeenCalledWith({ data: [entries[0]] });
  });
});
