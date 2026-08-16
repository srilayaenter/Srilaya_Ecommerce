import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const {
  mockOrderFindUnique,
  mockOrderUpdate,
  mockCartItemDeleteMany,
  mockCookieSet,
  mockCookieGet,
  mockSendEmail,
  mockLogPaymentEvent,
} = vi.hoisted(() => ({
  mockOrderFindUnique: vi.fn(),
  mockOrderUpdate: vi.fn(),
  mockCartItemDeleteMany: vi.fn(),
  mockCookieSet: vi.fn(),
  mockCookieGet: vi.fn(),
  mockSendEmail: vi.fn(),
  mockLogPaymentEvent: vi.fn(),
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    order: { findUnique: mockOrderFindUnique, update: mockOrderUpdate },
    cartItem: { deleteMany: mockCartItemDeleteMany },
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mockCookieGet, set: mockCookieSet }),
}));

vi.mock("../../apps/web/lib/email", () => ({ sendEmail: mockSendEmail }));
vi.mock("../../apps/web/lib/emails/orderConfirmation", () => ({ buildOrderConfirmationEmail: () => "<html></html>" }));
vi.mock("../../apps/web/lib/decimal", () => ({ toNum: (v: any) => Number(v) }));
vi.mock("../../apps/web/lib/loyalty", () => ({ earnPoints: vi.fn(), processReferral: vi.fn() }));
vi.mock("../../apps/web/lib/generateInvoicePdf", () => ({ generateInvoicePdf: vi.fn().mockResolvedValue(Buffer.from("")) }));
vi.mock("../../apps/web/lib/logger", () => ({
  log: { flush: vi.fn() },
  logPaymentVerified: vi.fn(),
  logPaymentFailed: vi.fn(),
  logError: vi.fn(),
}));
vi.mock("../../apps/web/lib/paymentAudit", () => ({ logPaymentEvent: mockLogPaymentEvent }));

import { POST } from "../../apps/web/app/api/payments/razorpay/verify/route";
import { orderAccessCookieName } from "../../apps/web/lib/orderAccess";

const RAZORPAY_SECRET = "test-razorpay-secret";

function sign(razorpayOrderId: string, razorpayPaymentId: string) {
  return crypto.createHmac("sha256", RAZORPAY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/payments/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RAZORPAY_KEY_SECRET = RAZORPAY_SECRET;
  mockCookieGet.mockReturnValue(undefined);
  mockSendEmail.mockResolvedValue({ success: true });
  mockCartItemDeleteMany.mockResolvedValue({ count: 0 });
});

describe("POST /api/payments/razorpay/verify — guest access grant", () => {
  it("mints an order-scoped access grant cookie only after a valid signature + order match", async () => {
    const razorpayOrderId = "rzp_order_1";
    const razorpayPaymentId = "rzp_pay_1";
    const signature = sign(razorpayOrderId, razorpayPaymentId);

    mockOrderFindUnique.mockResolvedValue({
      id: "order-guest-1",
      userId: null,
      paymentId: razorpayOrderId,
      status: "pending",
      email: null,
      total: 100,
    });
    mockOrderUpdate.mockResolvedValue({
      id: "order-guest-1",
      email: null,
      items: [],
      subtotal: 100, taxTotal: 0, shippingFee: 0, total: 100,
      customerName: "Test", address: "", city: "", state: "", zipCode: "",
    });

    const res = await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-guest-1",
    }));

    expect(res.status).toBe(200);
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    const [cookieName, cookieValue, cookieOptions] = mockCookieSet.mock.calls[0];
    expect(cookieName).toBe(orderAccessCookieName("order-guest-1"));
    expect(cookieValue).toMatch(/^\d+\.[a-f0-9]{64}$/);
    expect(cookieOptions.httpOnly).toBe(true);
    expect(cookieOptions.path).toBe("/orders/order-guest-1");
  });

  it("does NOT mint a grant when the signature is invalid", async () => {
    const res = await POST(makeRequest({
      razorpay_order_id: "rzp_order_1",
      razorpay_payment_id: "rzp_pay_1",
      razorpay_signature: "0".repeat(64),
      dbOrderId: "order-guest-1",
    }));

    expect(res.status).toBe(400);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("does NOT mint a grant when the order/razorpay-order-id pairing mismatches", async () => {
    const razorpayOrderId = "rzp_order_1";
    const razorpayPaymentId = "rzp_pay_1";
    const signature = sign(razorpayOrderId, razorpayPaymentId);

    mockOrderFindUnique.mockResolvedValue({
      id: "order-guest-1",
      userId: null,
      paymentId: "a-completely-different-razorpay-order-id",
      status: "pending",
    });

    const res = await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-guest-1",
    }));

    expect(res.status).toBe(400);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("does NOT mint a grant when the order does not exist", async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    const razorpayOrderId = "rzp_order_1";
    const razorpayPaymentId = "rzp_pay_1";
    const signature = sign(razorpayOrderId, razorpayPaymentId);

    const res = await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-nonexistent",
    }));

    expect(res.status).toBe(404);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("the minted grant is scoped to the verified order only — verifies false for any other order", async () => {
    const { verifyOrderAccessGrant } = await import("../../apps/web/lib/orderAccess");
    const razorpayOrderId = "rzp_order_1";
    const razorpayPaymentId = "rzp_pay_1";
    const signature = sign(razorpayOrderId, razorpayPaymentId);

    mockOrderFindUnique.mockResolvedValue({
      id: "order-guest-1", userId: null, paymentId: razorpayOrderId, status: "pending", email: null, total: 100,
    });
    mockOrderUpdate.mockResolvedValue({
      id: "order-guest-1", email: null, items: [],
      subtotal: 100, taxTotal: 0, shippingFee: 0, total: 100,
      customerName: "Test", address: "", city: "", state: "", zipCode: "",
    });

    await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-guest-1",
    }));

    const [, cookieValue] = mockCookieSet.mock.calls[0];
    expect(verifyOrderAccessGrant("order-guest-1", cookieValue)).toBe(true);
    expect(verifyOrderAccessGrant("order-guest-OTHER", cookieValue)).toBe(false);
  });

  it("never logs the raw grant cookie value or its signature", async () => {
    const razorpayOrderId = "rzp_order_1";
    const razorpayPaymentId = "rzp_pay_1";
    const signature = sign(razorpayOrderId, razorpayPaymentId);

    mockOrderFindUnique.mockResolvedValue({
      id: "order-guest-1", userId: null, paymentId: razorpayOrderId, status: "pending", email: null, total: 100,
    });
    mockOrderUpdate.mockResolvedValue({
      id: "order-guest-1", email: null, items: [],
      subtotal: 100, taxTotal: 0, shippingFee: 0, total: 100,
      customerName: "Test", address: "", city: "", state: "", zipCode: "",
    });

    await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-guest-1",
    }));

    const [, cookieValue] = mockCookieSet.mock.calls[0];
    for (const call of mockLogPaymentEvent.mock.calls) {
      expect(JSON.stringify(call)).not.toContain(cookieValue);
    }
  });
});
