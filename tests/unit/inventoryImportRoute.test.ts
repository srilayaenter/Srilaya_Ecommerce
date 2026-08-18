import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockFindMany, mockUpdateMany, mockRateLimit, mockLogStockChanges } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockRateLimit: vi.fn(),
  mockLogStockChanges: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    productVariant: {
      findMany: mockFindMany,
      updateMany: mockUpdateMany,
    },
  },
}));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockRateLimit }));
vi.mock("../../apps/web/lib/stockLog", () => ({ logStockChanges: mockLogStockChanges }));

import { POST } from "../../apps/web/app/api/admin/inventory/import/route";

function makeRequest(csv: string) {
  return new Request("http://localhost/api/admin/inventory/import", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: csv,
  });
}

const VARIANT_A = { id: "variant-a", sku: "SKU-A", stock: 50 };
const VARIANT_B = { id: "variant-b", sku: "SKU-B", stock: 20 };

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue(null);
  mockLogStockChanges.mockResolvedValue(undefined);
  mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } });
  mockFindMany.mockResolvedValue([VARIANT_A, VARIANT_B]);
  mockUpdateMany.mockResolvedValue({ count: 1 });
});

describe("POST /api/admin/inventory/import — authorization", () => {
  it.each(["admin", "manager", "inventory_staff"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await POST(makeRequest("sku,stock\nSKU-A,60"));
    expect(res.status).toBe(200);
  });

  it("rejects unauthorized roles with no DB query", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "billing_staff" } });
    const res = await POST(makeRequest("sku,stock\nSKU-A,60"));
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests with no DB query", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest("sku,stock\nSKU-A,60"));
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/inventory/import — concurrency: optimistic expected-value locking", () => {
  it("unchanged expected quantity succeeds — the row's write is guarded by the original snapshot", async () => {
    const res = await POST(makeRequest("sku,stock\nSKU-A,60"));
    const body = await res.json();
    expect(body.updated).toBe(1);
    expect(body.conflicted).toEqual([]);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "variant-a", stock: 50 }, // the originally-fetched snapshot, not the new row value
      data: { stock: 60 },
    });
  });

  it("concurrent quantity change (a DIFFERENT process changed stock after the snapshot) is rejected, not overwritten", async () => {
    // Simulate: updateMany's guard (stock: 50) no longer matches the real
    // current value, because something else changed it concurrently — Prisma
    // reports 0 rows affected.
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const res = await POST(makeRequest("sku,stock\nSKU-A,60"));
    const body = await res.json();
    expect(body.updated).toBe(0);
    expect(body.conflicted).toEqual(["SKU-A"]);
    expect(body.skipped).toBe(1);
  });

  it("a concurrent ORDER DECREMENT cannot be silently overwritten by the import", async () => {
    // The order's atomic, gte-guarded decrement already committed between the
    // import's findMany snapshot and this row's write attempt — the
    // variant's real stock is now different from what the import saw, so the
    // optimistic-lock condition (stock: 50) fails and Prisma reports 0 rows.
    mockUpdateMany.mockImplementation(async ({ where }: any) => {
      // Real current stock is 45 (order took 5 units) — the import's guard
      // condition (stock: 50) does not match it.
      return where.stock === 45 ? { count: 1 } : { count: 0 };
    });
    const res = await POST(makeRequest("sku,stock\nSKU-A,60"));
    const body = await res.json();
    expect(body.conflicted).toEqual(["SKU-A"]);
    expect(body.updated).toBe(0);
    // No stock-log entry is written for a conflicted row — it never applied.
    expect(mockLogStockChanges).toHaveBeenCalledWith([]);
  });

  it("does not overwrite price/reorderThreshold either when the row is conflicted (all-or-nothing per row)", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const res = await POST(makeRequest("sku,stock,price,reorderThreshold\nSKU-A,60,199.00,10"));
    const body = await res.json();
    expect(body.conflicted).toEqual(["SKU-A"]);
    // The one and only updateMany call attempted stock+price+reorderThreshold
    // together and was rejected as a whole — no partial-field application.
    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
  });

  it("a conflicted row does not affect other rows in the same file — import remains per-row independent, not all-or-nothing", async () => {
    mockUpdateMany.mockImplementation(async ({ where }: any) =>
      where.id === "variant-a" ? { count: 0 } : { count: 1 },
    );
    const res = await POST(makeRequest("sku,stock\nSKU-A,60\nSKU-B,25"));
    const body = await res.json();
    expect(body.conflicted).toEqual(["SKU-A"]);
    expect(body.updated).toBe(1); // SKU-B still applied
  });
});

describe("POST /api/admin/inventory/import — malformed rows preserve existing behavior", () => {
  it("still rejects a CSV with no data rows", async () => {
    const res = await POST(makeRequest("sku,stock"));
    expect(res.status).toBe(400);
  });

  it("still rejects a CSV missing required columns", async () => {
    const res = await POST(makeRequest("name,qty\nfoo,10"));
    expect(res.status).toBe(400);
  });

  it("still silently drops a row with a non-numeric stock value, leaving other rows unaffected (unchanged prior behavior)", async () => {
    const res = await POST(makeRequest("sku,stock\nSKU-A,notanumber\nSKU-B,25"));
    const body = await res.json();
    expect(body.updated).toBe(1); // only SKU-B, the malformed SKU-A row never reached the DB
    expect(body.conflicted).toEqual([]);
    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
  });

  it("a CSV with only a malformed row (no valid rows at all) is rejected up front, same as before", async () => {
    const res = await POST(makeRequest("sku,stock\nSKU-A,notanumber"));
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("still reports unknown SKUs as notFound, unaffected by the concurrency fix", async () => {
    const res = await POST(makeRequest("sku,stock\nSKU-UNKNOWN,10"));
    const body = await res.json();
    expect(body.notFound).toEqual(["SKU-UNKNOWN"]);
    expect(body.conflicted).toEqual([]);
  });
});

describe("POST /api/admin/inventory/import — no silent data loss", () => {
  it("a conflicted row is always reported in the response, never silently dropped without a trace", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const res = await POST(makeRequest("sku,stock\nSKU-A,60"));
    const body = await res.json();
    expect(body.conflicted).toContain("SKU-A");
    expect(body.skipped).toBeGreaterThan(0);
  });

  it("total accounted-for rows always equals updated + skipped (notFound + conflicted), nothing vanishes", async () => {
    mockUpdateMany.mockImplementation(async ({ where }: any) =>
      where.id === "variant-a" ? { count: 0 } : { count: 1 },
    );
    const res = await POST(makeRequest("sku,stock\nSKU-A,60\nSKU-B,25\nSKU-UNKNOWN,1"));
    const body = await res.json();
    const totalRows = 3;
    expect(body.updated + body.skipped).toBe(totalRows);
    expect(body.notFound.length + body.conflicted.length).toBe(body.skipped);
  });
});
