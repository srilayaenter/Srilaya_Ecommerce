import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockFindMany, mockRateLimit } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockFindMany: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: { productVariant: { findMany: mockFindMany } },
}));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockRateLimit }));

import { GET } from "../../apps/web/app/api/admin/variants/route";

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue(null);
  mockFindMany.mockImplementation(({ select }: any) => {
    // Simulate Prisma honoring the select — only echo back costPrice if the
    // caller's select actually asked for it.
    const includesCostPrice = "costPrice" in select;
    return Promise.resolve([
      {
        id: "v1",
        productId: "p1",
        size: "500g",
        price: "199.00",
        stock: 50,
        sku: "SKU-A",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        weightGrams: 500,
        reorderThreshold: 10,
        imageUrl: null,
        active: true,
        ...(includesCostPrice ? { costPrice: "120.00" } : {}),
        product: { title: "Test Product" },
      },
    ]);
  });
});

describe("GET /api/admin/variants — exact cost visibility", () => {
  it("owner receives costPrice", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "owner" } });
    const res = await GET();
    const body = await res.json();
    expect(body.variants[0].costPrice).toBe("120.00");
  });

  it("admin does not receive costPrice", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } });
    const res = await GET();
    const body = await res.json();
    expect(body.variants[0]).not.toHaveProperty("costPrice");
    // Operational fields remain present.
    expect(body.variants[0].sku).toBe("SKU-A");
    expect(body.variants[0].stock).toBe(50);
    expect(body.variants[0].price).toBe("199.00");
  });

  it.each(["manager", "inventory_staff", "billing_staff"])(
    "%s passes this route's own isAdminRole check (unchanged — no route-path access modified in this pass) but never receives costPrice",
    async (role) => {
      mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
      const res = await GET();
      const body = await res.json();
      expect(body.variants[0]).not.toHaveProperty("costPrice");
      expect(body.variants[0].sku).toBe("SKU-A");
    }
  );

  it("unauthenticated is rejected", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
