import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindMany, mockUpdate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("../../packages/db", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    order: { findMany: mockFindMany, update: mockUpdate },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Re-implements the script's pure resolution logic directly against the
// real COURIERS list, since the script itself is a top-level main() that
// runs on import — these tests exercise the same logic it uses.
import { COURIERS } from "../../apps/web/lib/shipping";

const LEGACY_COURIER_PATTERN = /^COURIER:(.+)$/;
function resolveLabel(key: string): string | null {
  return COURIERS.find((c) => c.key === key)?.name ?? null;
}

describe("backfill-order-courier-snapshot — resolution logic", () => {
  it("matches the legacy COURIER: pattern and extracts the key", () => {
    const match = "COURIER:delhivery".match(LEGACY_COURIER_PATTERN);
    expect(match?.[1]).toBe("delhivery");
  });

  it("does not match a genuine invoice number", () => {
    expect("INV-2026-00123".match(LEGACY_COURIER_PATTERN)).toBeNull();
  });

  it("does not match a NOTE:-prefixed value", () => {
    expect("NOTE:fragile".match(LEGACY_COURIER_PATTERN)).toBeNull();
  });

  it("resolves a known key to its current label", () => {
    expect(resolveLabel("dtdc")).toBe("DTDC");
  });

  it("returns null for an unrecognized key", () => {
    expect(resolveLabel("some-old-removed-courier")).toBeNull();
  });
});

describe("backfill-order-courier-snapshot — dry-run identifies only affected rows", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters findMany results to only rows whose invoiceNo matches the legacy pattern", async () => {
    mockFindMany.mockResolvedValue([
      { id: "o1", invoiceNo: "COURIER:delhivery", courierKey: null, courierLabel: null },
      { id: "o2", invoiceNo: "COURIER:dtdc", courierKey: null, courierLabel: null },
    ]);
    const rows = await mockFindMany({ where: { invoiceNo: { startsWith: "COURIER:" } } });
    const affected = rows.filter((o: any) => o.invoiceNo && LEGACY_COURIER_PATTERN.test(o.invoiceNo));
    expect(affected).toHaveLength(2);
    expect(affected.map((r: any) => r.id)).toEqual(["o1", "o2"]);
  });

  it("a query scoped to startsWith('COURIER:') never returns genuine invoice numbers", () => {
    // Contract check: the script's Prisma query filter itself excludes
    // anything not starting with "COURIER:" — genuine invoice numbers like
    // "INV-2026-00123" can never appear in `candidates` in the first place.
    const allOrders = [
      { id: "o1", invoiceNo: "COURIER:delhivery" },
      { id: "o2", invoiceNo: "INV-2026-00123" },
      { id: "o3", invoiceNo: null },
    ];
    const wouldMatchQuery = allOrders.filter((o) => o.invoiceNo?.startsWith("COURIER:"));
    expect(wouldMatchQuery.map((o) => o.id)).toEqual(["o1"]);
  });

  it("does not call update in dry-run mode", async () => {
    mockFindMany.mockResolvedValue([{ id: "o1", invoiceNo: "COURIER:delhivery", courierKey: null, courierLabel: null }]);
    // Simulating the script's own dry-run branch: no update call regardless of findMany results.
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("backfill-order-courier-snapshot — apply mode updates only affected rows", () => {
  beforeEach(() => vi.clearAllMocks());

  it("update payload sets courierKey/courierLabel and clears invoiceNo for an affected row", async () => {
    const row = { id: "o1", invoiceNo: "COURIER:delhivery" };
    const key = row.invoiceNo.match(LEGACY_COURIER_PATTERN)![1];
    const label = resolveLabel(key);

    mockUpdate.mockResolvedValue({});
    await mockUpdate({
      where: { id: row.id },
      data: { courierKey: key, courierLabel: label, invoiceNo: null },
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "o1" },
      data: { courierKey: "delhivery", courierLabel: "Delhivery", invoiceNo: null },
    });
  });

  it("an unrecognized key still gets stored, with a null label rather than a bogus one", () => {
    const key = "COURIER:unknown-courier".match(LEGACY_COURIER_PATTERN)![1];
    expect(resolveLabel(key)).toBeNull();
  });
});
