import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    paymentAuditLog: {
      create: vi.fn(),
    },
  },
}));

import { logPaymentEvent } from "@/lib/paymentAudit";
import { prisma } from "@/lib/db";

const mockCreate = vi.mocked(prisma.paymentAuditLog.create);

beforeEach(() => {
  mockCreate.mockReset();
});

describe("logPaymentEvent", () => {
  it("creates an audit log row with required fields", async () => {
    mockCreate.mockResolvedValueOnce({});

    await logPaymentEvent({ eventType: "payment.verified", status: "success" });

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "payment.verified",
        status: "success",
      }),
    });
  });

  it("passes all optional fields through when provided", async () => {
    mockCreate.mockResolvedValueOnce({});

    await logPaymentEvent({
      eventType: "payment.verified",
      status: "success",
      orderId: "ord-123",
      razorpayOrderId: "rz-order-abc",
      razorpayPaymentId: "rz-pay-xyz",
      amount: 499,
      userId: "usr-456",
      ipAddress: "1.2.3.4",
      userAgent: "Mozilla/5.0",
      metadata: { coupon: "SAVE10" },
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "ord-123",
        razorpayOrderId: "rz-order-abc",
        razorpayPaymentId: "rz-pay-xyz",
        amount: 499,
        userId: "usr-456",
        ipAddress: "1.2.3.4",
        userAgent: "Mozilla/5.0",
      }),
    });
  });

  it("nulls out optional fields when omitted", async () => {
    mockCreate.mockResolvedValueOnce({});

    await logPaymentEvent({ eventType: "payment.failed", status: "missing_fields" });

    const call = mockCreate.mock.calls[0][0].data;
    expect(call.orderId).toBeNull();
    expect(call.razorpayOrderId).toBeNull();
    expect(call.razorpayPaymentId).toBeNull();
    expect(call.amount).toBeNull();
    expect(call.userId).toBeNull();
    expect(call.ipAddress).toBeNull();
    expect(call.userAgent).toBeNull();
  });

  it("does not throw when DB write fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("DB connection lost"));

    await expect(
      logPaymentEvent({ eventType: "payment.verified", status: "success" })
    ).resolves.toBeUndefined();
  });

  it("does not throw on repeated DB failures", async () => {
    mockCreate.mockRejectedValue(new Error("timeout"));

    for (const eventType of [
      "payment.verified",
      "payment.signature_invalid",
      "payment.mismatch",
      "payment.captured_webhook",
      "payment.failed_webhook",
    ] as const) {
      await expect(
        logPaymentEvent({ eventType, status: "failed" })
      ).resolves.toBeUndefined();
    }
  });

  it("accepts all valid event types without type error", async () => {
    mockCreate.mockResolvedValue({});

    const eventTypes = [
      "payment.initiated",
      "payment.verified",
      "payment.failed",
      "payment.captured_webhook",
      "payment.failed_webhook",
      "payment.signature_invalid",
      "payment.mismatch",
    ] as const;

    for (const eventType of eventTypes) {
      await logPaymentEvent({ eventType, status: "ok" });
    }

    expect(mockCreate).toHaveBeenCalledTimes(eventTypes.length);
  });

  it("still resolves when DB write succeeds but returns unexpected value", async () => {
    mockCreate.mockResolvedValueOnce(null);

    await expect(
      logPaymentEvent({ eventType: "payment.captured_webhook", status: "success" })
    ).resolves.toBeUndefined();
  });
});
