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

const baseUpdatedOrder = {
  id: "order-guest-1",
  email: null,
  items: [],
  subtotal: 100, taxTotal: 0, shippingFee: 0, total: 100,
  customerName: "Test", address: "", city: "", state: "", zipCode: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RAZORPAY_KEY_SECRET = RAZORPAY_SECRET;
  // The cartId cookie is deliberately left absent/irrelevant in every test
  // here — cart-clearing must be driven entirely by order.cartId, never the
  // request's own cookie jar.
  mockCookieGet.mockReturnValue(undefined);
  mockSendEmail.mockResolvedValue({ success: true });
  mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
});

describe("POST /api/payments/razorpay/verify — cart clearing via order.cartId", () => {
  it("clears the cart using order.cartId, not the request's cartId cookie", async () => {
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
      cartId: "cart-from-order-snapshot",
    });
    mockOrderUpdate.mockResolvedValue(baseUpdatedOrder);

    const res = await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-guest-1",
    }));

    expect(res.status).toBe(200);
    expect(mockCartItemDeleteMany).toHaveBeenCalledWith({ where: { cartId: "cart-from-order-snapshot" } });
    // Never consult the cartId cookie for this decision.
    expect(mockCookieGet).not.toHaveBeenCalledWith("cartId");
  });

  it("does NOT attempt a cart clear when order.cartId is null (pre-migration order) — and still succeeds", async () => {
    const razorpayOrderId = "rzp_order_1";
    const razorpayPaymentId = "rzp_pay_1";
    const signature = sign(razorpayOrderId, razorpayPaymentId);

    mockOrderFindUnique.mockResolvedValue({
      id: "order-legacy-1",
      userId: null,
      paymentId: razorpayOrderId,
      status: "pending",
      email: null,
      total: 100,
      cartId: null,
    });
    mockOrderUpdate.mockResolvedValue({ ...baseUpdatedOrder, id: "order-legacy-1" });

    const res = await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-legacy-1",
    }));

    expect(res.status).toBe(200);
    expect(mockCartItemDeleteMany).not.toHaveBeenCalled();
  });

  it("a second verify call for an already-paid order does not attempt a redundant cart clear", async () => {
    const razorpayOrderId = "rzp_order_1";
    const razorpayPaymentId = "rzp_pay_1";
    const signature = sign(razorpayOrderId, razorpayPaymentId);

    mockOrderFindUnique.mockResolvedValue({
      id: "order-guest-1",
      userId: null,
      paymentId: razorpayOrderId,
      status: "paid",
      email: null,
      total: 100,
      cartId: "cart-from-order-snapshot",
      invoiceNo: "INV-1",
    });

    const res = await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-guest-1",
    }));

    // The route still returns success (idempotent re-verify) but must not
    // re-run the paid-status side effects, including the cart clear guarded
    // by `order.status !== 'paid'`.
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it("a deleteMany against an already-empty cart (e.g. webhook cleared it first) resolves without error", async () => {
    const razorpayOrderId = "rzp_order_1";
    const razorpayPaymentId = "rzp_pay_1";
    const signature = sign(razorpayOrderId, razorpayPaymentId);

    mockCartItemDeleteMany.mockResolvedValue({ count: 0 });
    mockOrderFindUnique.mockResolvedValue({
      id: "order-guest-1",
      userId: null,
      paymentId: razorpayOrderId,
      status: "pending",
      email: null,
      total: 100,
      cartId: "cart-already-cleared",
    });
    mockOrderUpdate.mockResolvedValue(baseUpdatedOrder);

    const res = await POST(makeRequest({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      dbOrderId: "order-guest-1",
    }));

    expect(res.status).toBe(200);
    expect(mockCartItemDeleteMany).toHaveBeenCalledWith({ where: { cartId: "cart-already-cleared" } });
  });
});
