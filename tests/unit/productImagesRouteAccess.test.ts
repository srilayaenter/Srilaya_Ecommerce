import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockCount, mockCreate, mockUpdate, mockDelete, mockRateLimit } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockCount: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockRateLimit: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    productImage: {
      count: mockCount,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockRateLimit }));

import { POST, PATCH, DELETE } from "../../apps/web/app/api/admin/products/[id]/images/route";

function makeParams() {
  return { params: Promise.resolve({ id: "product1" }) };
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products/product1/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/admin/products/product1/images", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new Request("http://localhost/api/admin/products/product1/images?imageId=img1", { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockReturnValue(null);
  mockCount.mockResolvedValue(0);
  mockCreate.mockResolvedValue({ id: "img1", productId: "product1", url: "https://example.com/a.jpg", alt: "", position: 0 });
  mockUpdate.mockResolvedValue({ id: "img1" });
  mockDelete.mockResolvedValue({ id: "img1" });
});

describe("POST /api/admin/products/[id]/images — authorization", () => {
  it.each(["owner", "admin", "manager", "inventory_staff"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await POST(makePostRequest({ url: "https://example.com/a.jpg" }), makeParams());
    expect(res.status).toBe(200);
  });

  it.each(["billing_staff", "customer"])("rejects role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await POST(makePostRequest({ url: "https://example.com/a.jpg" }), makeParams());
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makePostRequest({ url: "https://example.com/a.jpg" }), makeParams());
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/products/[id]/images — authorization", () => {
  const body = { images: [{ id: "img1", position: 0 }] };

  it.each(["owner", "admin", "manager", "inventory_staff"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await PATCH(makePatchRequest(body), makeParams());
    expect(res.status).toBe(200);
  });

  it.each(["billing_staff", "customer"])("rejects role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await PATCH(makePatchRequest(body), makeParams());
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await PATCH(makePatchRequest(body), makeParams());
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/products/[id]/images — authorization", () => {
  it.each(["owner", "admin", "manager", "inventory_staff"])("allows role %s", async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
    const res = await DELETE(makeDeleteRequest(), makeParams());
    expect(res.status).toBe(200);
  });

  it.each(["billing_staff", "customer"])("rejects role %s", async (role) => {
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
