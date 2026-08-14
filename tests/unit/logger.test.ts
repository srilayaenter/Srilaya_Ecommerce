import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-axiom Logger before importing logger.ts
// Must be a real class (not arrow fn) so `new Logger()` works
vi.mock("next-axiom", () => ({
  Logger: class {
    info  = vi.fn();
    warn  = vi.fn();
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
  const events = ["register", "login", "login_failed", "password_reset"] as const;

  for (const event of events) {
    it(`calls log.info with event 'auth.${event}'`, () => {
      logAuthEvent(event, { email: "user@example.com" });
      expect(log.info).toHaveBeenCalledWith(`auth.${event}`, { email: "user@example.com" });
    });
  }

  it("includes optional reason when provided", () => {
    logAuthEvent("login_failed", { email: "user@example.com", reason: "bad password" });
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
      expect.objectContaining({ error: "verification failed" })
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
    logError("webhook", new Error("failed"), { orderId: "order-005", attempt: 2 });
    const [, payload] = (log.error as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(payload.orderId).toBe("order-005");
    expect(payload.attempt).toBe(2);
  });
});
