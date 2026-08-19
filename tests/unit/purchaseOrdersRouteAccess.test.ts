import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockFindMany, mockRateLimit } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockFindMany: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: { purchaseOrder: { findMany: mockFindMany } },
}));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockRateLimit }));

import { GET } from "../../apps/web/app/api/admin/purchase-orders/route";

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue(null);
  mockFindMany.mockImplementation(({ include }: any) => {
    // Simulate Prisma honoring the select — only echo back unitCost if the
    // caller's select actually asked for it, so this test proves the route
    // itself decides inclusion, not just that the field exists somewhere.
    const includesUnitCost = "unitCost" in (include.items.select ?? {});
    return Promise.resolve([
      {
        id: "po1",
        supplier: { id: "s1", name: "Test Supplier" },
        items: [
          {
            id: "item1",
            sku: "SKU-A",
            quantityOrdered: 10,
            quantityReceived: 0,
            ...(includesUnitCost ? { unitCost: "42.50" } : {}),
          },
        ],
      },
    ]);
  });
});

describe("GET /api/admin/purchase-orders — exact cost visibility", () => {
  it("owner receives unitCost", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "owner" } });
    const res = await GET();
    const body = await res.json();
    expect(body.orders[0].items[0].unitCost).toBe("42.50");
  });

  it.each(["admin", "manager", "inventory_staff"])("%s does not receive unitCost", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await GET();
    const body = await res.json();
    expect(body.orders[0].items[0]).not.toHaveProperty("unitCost");
    // Non-cost fields remain present — operational data is preserved.
    expect(body.orders[0].items[0].sku).toBe("SKU-A");
    expect(body.orders[0].items[0].quantityOrdered).toBe(10);
  });

  it("billing_staff passes this route's own isAdminRole check (unchanged) but never receives unitCost", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "billing_staff" } });
    const res = await GET();
    const body = await res.json();
    expect(body.orders[0].items[0]).not.toHaveProperty("unitCost");
  });

  it("unauthenticated is rejected", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
