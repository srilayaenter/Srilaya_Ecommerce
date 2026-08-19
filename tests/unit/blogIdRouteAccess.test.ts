import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockUpdate, mockDelete, mockRateLimit } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    blogPost: {
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockRateLimit }));

import { PATCH, DELETE } from "../../apps/web/app/api/admin/blog/[id]/route";

function makeParams() {
  return { params: Promise.resolve({ id: "post1" }) };
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/admin/blog/post1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new Request("http://localhost/api/admin/blog/post1", { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue(null);
  mockUpdate.mockResolvedValue({ id: "post1" });
  mockDelete.mockResolvedValue({ id: "post1" });
});

describe("PATCH /api/admin/blog/[id] — authorization", () => {
  it.each(["owner", "admin", "manager"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await PATCH(makePatchRequest({ title: "Updated" }), makeParams());
    expect(res.status).toBe(200);
  });

  it.each(["inventory_staff", "billing_staff", "customer"])("rejects role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await PATCH(makePatchRequest({ title: "Updated" }), makeParams());
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await PATCH(makePatchRequest({ title: "Updated" }), makeParams());
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/blog/[id] — authorization", () => {
  it.each(["owner", "admin", "manager"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(200);
  });

  it.each(["inventory_staff", "billing_staff", "customer"])("rejects role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(401);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(401);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
