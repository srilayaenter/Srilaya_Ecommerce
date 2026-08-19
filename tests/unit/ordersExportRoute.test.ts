import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockFindMany, mockRateLimit } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockFindMany: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: { order: { findMany: mockFindMany } },
}));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockRateLimit }));

import { GET } from "../../apps/web/app/api/admin/orders/export/route";

function makeRequest() {
  return new Request("http://localhost/api/admin/orders/export");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue(null);
  mockFindMany.mockResolvedValue([]);
});

describe("GET /api/admin/orders/export — authorization", () => {
  it.each(["owner", "admin", "manager", "billing_staff"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it.each(["inventory_staff", "customer"])("rejects role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
