import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindMany, mockCheckRateLimit } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: { order: { findMany: mockFindMany } },
}));

vi.mock("../../apps/web/lib/rateLimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getIp: () => "203.0.113.9",
}));

import { POST } from "../../apps/web/app/api/account/orders/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/account/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue(true);
  mockFindMany.mockResolvedValue([]);
});

describe("POST /api/account/orders", () => {
  it("a client-supplied userId is ignored — only email is ever used as a filter", async () => {
    await POST(makeRequest({ userId: "some-other-users-id", email: "me@example.com" }));
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "me@example.com" } }),
    );
    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.where).not.toHaveProperty("userId");
  });

  it("a request with only userId (no email) and no phone support is rejected as missing email", async () => {
    const res = await POST(makeRequest({ userId: "some-other-users-id" }));
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("a request with only phone (no email) is rejected — phone lookup was removed as unused surface", async () => {
    const res = await POST(makeRequest({ phone: "9876543210" }));
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("rate-limits by IP and returns 429 without querying the database", async () => {
    mockCheckRateLimit.mockReturnValue(false);
    const res = await POST(makeRequest({ email: "me@example.com" }));
    expect(res.status).toBe(429);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns an empty array (not an error) for an email with zero matching orders — no enumeration signal", async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await POST(makeRequest({ email: "unknown@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toEqual([]);
  });

  it("does not include tracking numbers for a request whose orders have no shipment", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "order-1",
        total: { toString: () => "100" },
        createdAt: new Date(),
        status: "paid",
        fulfillmentStatus: "pending",
        orderChannel: "online",
        paymentMethod: "razorpay",
        items: [],
        shipment: null,
      },
    ]);
    const res = await POST(makeRequest({ email: "me@example.com" }));
    const body = await res.json();
    expect(body.orders[0].trackingNumber).toBeNull();
    expect(body.orders[0].hasShipment).toBe(false);
  });
});
