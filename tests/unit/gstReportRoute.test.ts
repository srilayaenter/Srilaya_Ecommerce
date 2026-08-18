import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockFindMany, mockRateLimit } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockFindMany: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    order: { findMany: mockFindMany },
    return: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockRateLimit }));

import { GET } from "../../apps/web/app/api/admin/gst-report/route";

function makeRequest(month = 8, year = 2026) {
  return new Request(`http://localhost/api/admin/gst-report?month=${month}&year=${year}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockRateLimit.mockReturnValue(null);
});

describe("GET /api/admin/gst-report — authorization", () => {
  it.each(["owner", "admin", "manager"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it.each(["inventory_staff", "billing_staff", "customer", ""])(
    "rejects role %s with 401, no DB query",
    async (role) => {
      mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
      expect(mockFindMany).not.toHaveBeenCalled();
    },
  );

  it("rejects an unauthenticated request", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
