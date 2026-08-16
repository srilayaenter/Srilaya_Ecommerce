import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockOrderFindUnique,
  mockOrderUpdate,
  mockGetServerSession,
  mockRazorpayOrdersCreate,
} = vi.hoisted(() => ({
  mockOrderFindUnique: vi.fn(),
  mockOrderUpdate: vi.fn(),
  mockGetServerSession: vi.fn(),
  mockRazorpayOrdersCreate: vi.fn(),
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: { order: { findUnique: mockOrderFindUnique, update: mockOrderUpdate } },
}));
vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("razorpay", () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(function (this: any) {
    this.orders = { create: mockRazorpayOrdersCreate };
  }),
}));

import { POST } from "../../apps/web/app/api/payments/razorpay/order/route";
import { buildPayCapabilityToken } from "../../apps/web/lib/payAuth";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/payments/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PENDING_GUEST_ORDER = {
  id: "order-guest-1",
  userId: null,
  status: "pending",
  total: 100,
};

const PENDING_OWNED_ORDER = {
  id: "order-owned-1",
  userId: "user-1",
  status: "pending",
  total: 100,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
  process.env.RAZORPAY_KEY_SECRET = "test-razorpay-secret";
  mockGetServerSession.mockResolvedValue(null);
  mockRazorpayOrdersCreate.mockResolvedValue({ id: "rzp_order_new", amount: 10000, currency: "INR" });
  mockOrderUpdate.mockResolvedValue({});
});

describe("POST /api/payments/razorpay/order — authorization", () => {
  it("guessed order ID with no capability token is denied (403), Razorpay is never called, paymentId is never mutated", async () => {
    mockOrderFindUnique.mockResolvedValue(PENDING_GUEST_ORDER);
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1" }));
    expect(res.status).toBe(403);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it("a nonexistent order returns a generic error, Razorpay is never called", async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "does-not-exist" }));
    expect(res.status).toBe(404);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
  });

  it("logged-in owner is allowed", async () => {
    mockOrderFindUnique.mockResolvedValue(PENDING_OWNED_ORDER);
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1", role: "customer" } });
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-owned-1" }));
    expect(res.status).toBe(200);
    expect(mockRazorpayOrdersCreate).toHaveBeenCalledTimes(1);
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: "order-owned-1" },
      data: { paymentId: "rzp_order_new" },
    });
  });

  it("logged-in non-owner is denied, Razorpay is never called", async () => {
    mockOrderFindUnique.mockResolvedValue(PENDING_OWNED_ORDER);
    mockGetServerSession.mockResolvedValue({ user: { id: "user-2", role: "customer" } });
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-owned-1" }));
    expect(res.status).toBe(403);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
  });

  it("valid guest capability token is allowed", async () => {
    mockOrderFindUnique.mockResolvedValue(PENDING_GUEST_ORDER);
    const token = buildPayCapabilityToken("order-guest-1");
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: token }));
    expect(res.status).toBe(200);
    expect(mockRazorpayOrdersCreate).toHaveBeenCalledTimes(1);
  });

  it("a malformed token is denied", async () => {
    mockOrderFindUnique.mockResolvedValue(PENDING_GUEST_ORDER);
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: "garbage-not-a-token" }));
    expect(res.status).toBe(403);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
  });

  it("an expired token is denied", async () => {
    mockOrderFindUnique.mockResolvedValue(PENDING_GUEST_ORDER);
    const crypto = await import("crypto");
    const key = crypto.createHash("sha256").update(`payauth:v1:${process.env.NEXTAUTH_SECRET ?? ""}`).digest();
    const expiresAtMs = Date.now() - 1000;
    const sig = crypto.createHmac("sha256", key).update(`payauth:v1:order-guest-1:${expiresAtMs}`).digest("hex");
    const expiredToken = Buffer.from(`order-guest-1:${expiresAtMs}:${sig}`).toString("base64url");

    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: expiredToken }));
    expect(res.status).toBe(403);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
  });

  it("a token minted for a different order is denied (cross-order)", async () => {
    mockOrderFindUnique.mockResolvedValue(PENDING_GUEST_ORDER);
    const tokenForOther = buildPayCapabilityToken("order-guest-OTHER");
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: tokenForOther }));
    expect(res.status).toBe(403);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
  });

  it("rejects a paid order even with a valid-looking token, without calling Razorpay", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...PENDING_GUEST_ORDER, status: "paid" });
    const token = buildPayCapabilityToken("order-guest-1");
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: token }));
    expect(res.status).toBe(400);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
  });

  it("rejects a cancelled order, without calling Razorpay", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...PENDING_GUEST_ORDER, status: "cancelled" });
    const token = buildPayCapabilityToken("order-guest-1");
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: token }));
    expect(res.status).toBe(400);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
  });

  it("rejects an expired-status order, without calling Razorpay", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...PENDING_GUEST_ORDER, status: "expired" });
    const token = buildPayCapabilityToken("order-guest-1");
    const res = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: token }));
    expect(res.status).toBe(400);
    expect(mockRazorpayOrdersCreate).not.toHaveBeenCalled();
  });

  it("RETRY: a legitimate authorized caller can call this endpoint twice in a row without failure", async () => {
    mockOrderFindUnique.mockResolvedValue(PENDING_GUEST_ORDER);
    const token = buildPayCapabilityToken("order-guest-1");

    const res1 = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: token }));
    expect(res1.status).toBe(200);

    mockRazorpayOrdersCreate.mockResolvedValueOnce({ id: "rzp_order_retry", amount: 10000, currency: "INR" });
    const res2 = await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: token }));
    expect(res2.status).toBe(200);

    expect(mockRazorpayOrdersCreate).toHaveBeenCalledTimes(2);
    // Second call's paymentId overwrite is the intended, safe behavior — the
    // customer's next verify() call will match whichever Razorpay order they
    // actually pay through, since that's the one still open in their browser.
    expect(mockOrderUpdate).toHaveBeenLastCalledWith({
      where: { id: "order-guest-1" },
      data: { paymentId: "rzp_order_retry" },
    });
  });

  it("never logs a raw capability token", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockOrderFindUnique.mockResolvedValue(PENDING_GUEST_ORDER);
    const token = buildPayCapabilityToken("order-guest-1");
    await POST(makeRequest({ amount: 100, currency: "INR", dbOrderId: "order-guest-1", payToken: token }));

    for (const call of consoleSpy.mock.calls) {
      expect(JSON.stringify(call)).not.toContain(token);
    }
    consoleSpy.mockRestore();
  });
});
