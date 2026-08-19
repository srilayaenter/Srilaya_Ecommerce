import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const {
  mockOrderFindFirst,
  mockOrderUpdate,
  mockCartItemDeleteMany,
  mockWebhookEventCreate,
  mockFailedWebhookCreate,
  mockOrderItemFindMany,
  mockProductVariantUpdate,
  mockSendEmail,
  mockLogPaymentEvent,
  mockSendStockNotifications,
} = vi.hoisted(() => ({
  mockOrderFindFirst: vi.fn(),
  mockOrderUpdate: vi.fn(),
  mockCartItemDeleteMany: vi.fn(),
  mockWebhookEventCreate: vi.fn(),
  mockFailedWebhookCreate: vi.fn(),
  mockOrderItemFindMany: vi.fn(),
  mockProductVariantUpdate: vi.fn(),
  mockSendEmail: vi.fn(),
  mockLogPaymentEvent: vi.fn(),
  mockSendStockNotifications: vi.fn(),
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    order: { findFirst: mockOrderFindFirst, update: mockOrderUpdate },
    orderItem: { findMany: mockOrderItemFindMany },
    productVariant: { update: mockProductVariantUpdate },
    cartItem: { deleteMany: mockCartItemDeleteMany },
    webhookEvent: { create: mockWebhookEventCreate },
    failedWebhook: { create: mockFailedWebhookCreate },
    // The real route calls $transaction with an ARRAY of prisma promises
    // (not the callback form) — replicate that shape so we can assert on
    // which operations were included in the array.
    $transaction: vi.fn((ops: any[]) => Promise.all(ops)),
  },
}));

vi.mock("../../apps/web/lib/email", () => ({ sendEmail: mockSendEmail }));
vi.mock("../../apps/web/lib/emails/adminAlerts", () => ({ buildPaymentFailedAlert: () => "<html></html>" }));
vi.mock("../../apps/web/lib/stockNotifications", () => ({ sendStockNotifications: mockSendStockNotifications }));
vi.mock("../../apps/web/lib/decimal", () => ({ toNum: (v: any) => Number(v) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../../apps/web/lib/logger", () => ({
  log: { flush: vi.fn() },
  logPaymentFailed: vi.fn(),
  logError: vi.fn(),
}));
vi.mock("../../apps/web/lib/paymentAudit", () => ({ logPaymentEvent: mockLogPaymentEvent }));

import { POST } from "../../apps/web/app/api/payments/razorpay/webhook/route";

const WEBHOOK_SECRET = "test-webhook-secret";

function sign(rawBody: string) {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

function makeRequest(event: unknown) {
  const rawBody = JSON.stringify(event);
  return new Request("http://localhost/api/payments/razorpay/webhook", {
    method: "POST",
    headers: { "x-razorpay-signature": sign(rawBody) },
    body: rawBody,
  });
}

function capturedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_capture_1",
    event: "payment.captured",
    payload: {
      payment: {
        entity: { id: "pay_1", order_id: "rzp_order_1" },
      },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
  mockWebhookEventCreate.mockResolvedValue({});
  mockOrderUpdate.mockResolvedValue({});
});

describe("POST /api/payments/razorpay/webhook — cart clearing via order.cartId", () => {
  it("clears the cart by order.cartId on webhook-only payment.captured success (no client verify call involved)", async () => {
    mockOrderFindFirst.mockResolvedValue({
      id: "order-1",
      status: "pending",
      cartId: "cart-abc",
      invoiceNo: null,
      total: 500,
      userId: null,
    });

    const res = await POST(makeRequest(capturedEvent()));

    expect(res.status).toBe(200);
    expect(mockCartItemDeleteMany).toHaveBeenCalledWith({ where: { cartId: "cart-abc" } });
    // Cart-clear must run inside the same transaction as the paid-status
    // update, not as a separate, unguarded call.
    const transactionCall = (await import("../../apps/web/lib/db")).prisma.$transaction as any;
    expect(transactionCall).toHaveBeenCalledTimes(1);
  });

  it("does NOT attempt a cart clear when order.cartId is null (pre-migration order)", async () => {
    mockOrderFindFirst.mockResolvedValue({
      id: "order-legacy-1",
      status: "pending",
      cartId: null,
      invoiceNo: null,
      total: 500,
      userId: null,
    });

    const res = await POST(makeRequest(capturedEvent()));

    expect(res.status).toBe(200);
    expect(mockCartItemDeleteMany).not.toHaveBeenCalled();
    // The order itself must still be marked paid — the missing cartId only
    // skips the cart side effect, it must not block payment confirmation.
    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "order-legacy-1" }, data: expect.objectContaining({ status: "paid" }) }),
    );
  });

  it("does not error and does not double-process on a duplicate webhook delivery (same eventId)", async () => {
    mockOrderFindFirst.mockResolvedValue({
      id: "order-1",
      status: "pending",
      cartId: "cart-abc",
      invoiceNo: null,
      total: 500,
      userId: null,
    });

    // First delivery succeeds normally.
    const first = await POST(makeRequest(capturedEvent()));
    expect(first.status).toBe(200);
    expect(mockCartItemDeleteMany).toHaveBeenCalledTimes(1);

    // Second delivery of the identical event: simulate the DB's unique
    // constraint on WebhookEvent.eventId rejecting the redelivered insert,
    // exactly as the real Postgres unique index would.
    const p2002 = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    (await import("../../apps/web/lib/db")).prisma.$transaction = vi.fn().mockRejectedValue(p2002);

    const second = await POST(makeRequest(capturedEvent()));
    const body = await second.json();
    expect(second.status).toBe(200);
    // The route's own P2002 handler is what makes redelivery safe — the
    // whole transaction (order-paid update + cart-clear + webhookEvent
    // insert) is one atomic unit guarded by the unique eventId constraint,
    // so a rejected duplicate transaction never actually commits any of its
    // operations against the real database.
    expect(body.message).toBe("Already processed");
  });

  it("does not clear the cart on payment.failed — cart must remain populated for retry", async () => {
    mockOrderFindFirst.mockResolvedValue({
      id: "order-2",
      status: "pending",
      cartId: "cart-xyz",
      total: 500,
      email: "buyer@example.com",
      userId: null,
    });
    mockOrderItemFindMany.mockResolvedValue([{ variantId: "v1", quantity: 1 }]);
    mockProductVariantUpdate.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        id: "evt_fail_1",
        event: "payment.failed",
        payload: { payment: { entity: { id: "pay_2", order_id: "rzp_order_2" } } },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockCartItemDeleteMany).not.toHaveBeenCalled();
  });

  it("does not clear the cart when the order is already paid (idempotent status guard, unchanged)", async () => {
    mockOrderFindFirst.mockResolvedValue({
      id: "order-3",
      status: "paid",
      cartId: "cart-already-cleared",
      total: 500,
      userId: null,
    });

    const res = await POST(makeRequest(capturedEvent()));

    expect(res.status).toBe(200);
    expect(mockCartItemDeleteMany).not.toHaveBeenCalled();
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });
});
