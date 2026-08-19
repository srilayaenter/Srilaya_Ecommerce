import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockFindMany, mockFindUnique, mockCreate, mockRateLimit } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    blogPost: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockRateLimit }));

import { GET, POST } from "../../apps/web/app/api/admin/blog/route";

function makeGetRequest() {
  return new Request("http://localhost/api/admin/blog");
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/admin/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue(null);
  mockFindMany.mockResolvedValue([]);
  mockFindUnique.mockResolvedValue(null);
  mockCreate.mockResolvedValue({ id: "post1", slug: "test-post" });
});

describe("GET /api/admin/blog — authorization", () => {
  it.each(["owner", "admin", "manager"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it.each(["inventory_staff", "billing_staff", "customer"])("rejects role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/blog — authorization", () => {
  const validBody = { title: "Test Post", content: "Some content" };

  it.each(["owner", "admin", "manager"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(201);
  });

  it.each(["inventory_staff", "billing_staff", "customer"])("rejects role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
