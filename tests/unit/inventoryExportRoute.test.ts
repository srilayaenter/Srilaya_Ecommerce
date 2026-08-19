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

import { GET } from "../../apps/web/app/api/admin/inventory/export/route";

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue(null);
  mockFindMany.mockResolvedValue([
    { sku: "SKU-A", size: "500g", stock: 10, price: "100.00", reorderThreshold: 5, product: { title: "Test", sku: "SKU-A" } },
  ]);
});

describe("GET /api/admin/inventory/export — authorization", () => {
  it.each(["owner", "admin", "manager", "inventory_staff"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("SKU-A");
  });

  it.each(["billing_staff", "customer"])("rejects role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
