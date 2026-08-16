import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-axiom Logger before importing logger.ts
// Must be a real class (not arrow fn) so `new Logger()` works
vi.mock("next-axiom", () => ({
  Logger: class {
    info = vi.fn();
    warn = vi.fn();
    error = vi.fn();
  },
}));

import {
  log,
  logOrderPlaced,
  logPaymentVerified,
  logPaymentFailed,
  logOrderCancelled,
  logAuthEvent,
  logError,
  logPaymentStatusChange,
  type PaymentStatusChangeResult,
} from "../../apps/web/lib/logger";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── logOrderPlaced ────────────────────────────────────────────────────────────

describe("logOrderPlaced", () => {
  const params = {
    orderId: "order-001",
    invoiceNo: "INV-001",
    customerName: "Priya",
    email: "priya@example.com",
    total: 498,
    paymentMethod: "online",
    itemCount: 3,
    city: "Bengaluru",
    state: "Karnataka",
  };

  it("calls log.info with event 'order.placed'", () => {
    logOrderPlaced(params);
    expect(log.info).toHaveBeenCalledWith("order.placed", params);
  });

  it("passes all fields to log.info", () => {
    logOrderPlaced(params);
    const [, payload] = (log.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.orderId).toBe("order-001");
    expect(payload.total).toBe(498);
    expect(payload.itemCount).toBe(3);
  });
});

// ── logPaymentVerified ────────────────────────────────────────────────────────

describe("logPaymentVerified", () => {
  const params = {
    orderId: "order-002",
    razorpayOrderId: "rzp_order_001",
    razorpayPaymentId: "rzp_pay_001",
    total: 799,
    email: "user@example.com",
  };

  it("calls log.info with event 'payment.verified'", () => {
    logPaymentVerified(params);
    expect(log.info).toHaveBeenCalledWith("payment.verified", params);
  });
});

// ── logPaymentFailed ──────────────────────────────────────────────────────────

describe("logPaymentFailed", () => {
  it("calls log.warn with event 'payment.failed'", () => {
    const params = { reason: "signature mismatch", orderId: "order-003" };
    logPaymentFailed(params);
    expect(log.warn).toHaveBeenCalledWith("payment.failed", params);
  });

  it("works with only the required reason field", () => {
    logPaymentFailed({ reason: "timeout" });
    expect(log.warn).toHaveBeenCalledTimes(1);
  });
});

// ── logOrderCancelled ─────────────────────────────────────────────────────────

describe("logOrderCancelled", () => {
  it("calls log.info with event 'order.cancelled'", () => {
    const params = { orderId: "order-004", reason: "customer request" };
    logOrderCancelled(params);
    expect(log.info).toHaveBeenCalledWith("order.cancelled", params);
  });
});

// ── logAuthEvent ──────────────────────────────────────────────────────────────

describe("logAuthEvent", () => {
  const events = [
    "register",
    "login",
    "login_failed",
    "password_reset",
  ] as const;

  for (const event of events) {
    it(`calls log.info with event 'auth.${event}'`, () => {
      logAuthEvent(event, { email: "user@example.com" });
      expect(log.info).toHaveBeenCalledWith(`auth.${event}`, {
        email: "user@example.com",
      });
    });
  }

  it("includes optional reason when provided", () => {
    logAuthEvent("login_failed", {
      email: "user@example.com",
      reason: "bad password",
    });
    const [, payload] = (log.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.reason).toBe("bad password");
  });
});

// ── logError ──────────────────────────────────────────────────────────────────

describe("logError", () => {
  it("calls log.error with the context string", () => {
    logError("payment-webhook", new Error("verification failed"));
    expect(log.error).toHaveBeenCalledWith(
      "payment-webhook",
      expect.objectContaining({ error: "verification failed" }),
    );
  });

  it("extracts message from Error objects", () => {
    logError("some-context", new Error("something broke"));
    const [, payload] = (log.error as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.error).toBe("something broke");
  });

  it("converts non-Error values to string", () => {
    logError("some-context", "plain string error");
    const [, payload] = (log.error as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.error).toBe("plain string error");
  });

  it("merges extra fields into the payload", () => {
    logError("webhook", new Error("failed"), {
      orderId: "order-005",
      attempt: 2,
    });
    const [, payload] = (log.error as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.orderId).toBe("order-005");
    expect(payload.attempt).toBe(2);
  });
});

// ── logPaymentStatusChange ────────────────────────────────────────────────────

describe("logPaymentStatusChange", () => {
  const baseParams = {
    orderId: "order-100",
    actorId: "user-admin-001",
    actorRole: "admin",
    fromStatus: "pending",
    toStatus: "paid",
    source: "manual_update" as const,
  };

  it("calls log.info with event 'payment.status_changed' on success", () => {
    logPaymentStatusChange({ ...baseParams, result: "success" });
    expect(log.info).toHaveBeenCalledWith("payment.status_changed", {
      ...baseParams,
      result: "success",
    });
    expect(log.warn).not.toHaveBeenCalled();
  });

  it("calls log.warn with event 'payment.status_change_rejected' for rejected_unauthorised", () => {
    logPaymentStatusChange({ ...baseParams, result: "rejected_unauthorised" });
    expect(log.warn).toHaveBeenCalledWith("payment.status_change_rejected", {
      ...baseParams,
      result: "rejected_unauthorised",
    });
    expect(log.info).not.toHaveBeenCalled();
  });

  it("calls log.warn for rejected_invalid_status", () => {
    logPaymentStatusChange({
      ...baseParams,
      result: "rejected_invalid_status",
    });
    expect(log.warn).toHaveBeenCalledWith(
      "payment.status_change_rejected",
      expect.objectContaining({ result: "rejected_invalid_status" }),
    );
  });

  it("calls log.warn for rejected_cancelled_order", () => {
    logPaymentStatusChange({
      ...baseParams,
      result: "rejected_cancelled_order",
    });
    expect(log.warn).toHaveBeenCalledWith(
      "payment.status_change_rejected",
      expect.objectContaining({ result: "rejected_cancelled_order" }),
    );
  });

  it("includes all required audit fields in the payload", () => {
    logPaymentStatusChange({ ...baseParams, result: "success" });
    const [, payload] = (log.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.orderId).toBe("order-100");
    expect(payload.actorId).toBe("user-admin-001");
    expect(payload.actorRole).toBe("admin");
    expect(payload.fromStatus).toBe("pending");
    expect(payload.toStatus).toBe("paid");
    expect(payload.source).toBe("manual_update");
    expect(payload.result).toBe("success");
  });

  it("accepts 'cod_collected' as a valid source", () => {
    logPaymentStatusChange({
      ...baseParams,
      source: "cod_collected",
      result: "success",
    });
    const [, payload] = (log.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.source).toBe("cod_collected");
  });

  it("does not include password, token, card, or secret fields", () => {
    logPaymentStatusChange({ ...baseParams, result: "success" });
    const [, payload] = (log.info as ReturnType<typeof vi.fn>).mock.calls[0];
    const keys = Object.keys(payload);
    expect(keys).not.toContain("password");
    expect(keys).not.toContain("token");
    expect(keys).not.toContain("secret");
    expect(keys).not.toContain("cardNumber");
    expect(keys).not.toContain("codUpiRef");
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("phone");
    expect(keys).not.toContain("customerName");
  });

  it("calls log.info exactly once per successful invocation", () => {
    logPaymentStatusChange({ ...baseParams, result: "success" });
    expect(log.info).toHaveBeenCalledTimes(1);
  });

  it("calls log.warn exactly once per rejected invocation", () => {
    logPaymentStatusChange({ ...baseParams, result: "rejected_unauthorised" });
    expect(log.warn).toHaveBeenCalledTimes(1);
  });

  // Verify that all four result values in the union are handled without error.
  const allResults: PaymentStatusChangeResult[] = [
    "success",
    "rejected_unauthorised",
    "rejected_invalid_status",
    "rejected_cancelled_order",
  ];

  for (const result of allResults) {
    it(`does not throw for result '${result}'`, () => {
      expect(() =>
        logPaymentStatusChange({ ...baseParams, result }),
      ).not.toThrow();
    });
  }
});
