import { describe, it, expect } from "vitest";
import {
  PAYMENT_STATUSES,
  ADMIN_WRITABLE_PAYMENT_STATUSES,
  FULFILLMENT_STATUSES,
  FULFILLMENT_TRANSITIONS,
  isValidPaymentStatus,
  isAdminWritablePaymentStatus,
  isValidFulfillmentStatus,
  isAllowedFulfillmentTransition,
  isCustomerAllowedFulfillmentTransition,
  needsConfirmedShipmentBeforeProcessing,
  type PaymentStatus,
  type AdminWritablePaymentStatus,
  type FulfillmentStatus,
} from "../../apps/web/lib/orderConstants";

// ── PAYMENT_STATUSES constant ─────────────────────────────────────────────────

describe("PAYMENT_STATUSES", () => {
  it("contains exactly the six expected values", () => {
    expect(PAYMENT_STATUSES).toEqual([
      "pending",
      "cod_pending",
      "paid",
      "failed",
      "cancelled",
      "expired",
    ]);
  });

  it("includes 'expired' (written by cron release-stock)", () => {
    expect(PAYMENT_STATUSES).toContain("expired");
  });

  it("does not include 'cod_paid' (legacy read-only alias, never written)", () => {
    expect(PAYMENT_STATUSES).not.toContain("cod_paid");
  });

  it("is a readonly tuple — length is 6", () => {
    expect(PAYMENT_STATUSES.length).toBe(6);
  });
});

// ── ADMIN_WRITABLE_PAYMENT_STATUSES constant ──────────────────────────────────

describe("ADMIN_WRITABLE_PAYMENT_STATUSES", () => {
  it("contains exactly the five admin-writable values", () => {
    expect(ADMIN_WRITABLE_PAYMENT_STATUSES).toEqual([
      "pending",
      "cod_pending",
      "paid",
      "failed",
      "cancelled",
    ]);
  });

  it("does NOT include 'expired' (cron-only, not manually settable)", () => {
    expect(ADMIN_WRITABLE_PAYMENT_STATUSES).not.toContain("expired");
  });

  it("does NOT include 'cod_paid'", () => {
    expect(ADMIN_WRITABLE_PAYMENT_STATUSES).not.toContain("cod_paid");
  });

  it("is a strict subset of PAYMENT_STATUSES", () => {
    for (const s of ADMIN_WRITABLE_PAYMENT_STATUSES) {
      expect(PAYMENT_STATUSES).toContain(s);
    }
  });
});

// ── FULFILLMENT_STATUSES constant ─────────────────────────────────────────────

describe("FULFILLMENT_STATUSES", () => {
  it("contains exactly the four expected values", () => {
    expect(FULFILLMENT_STATUSES).toEqual([
      "pending",
      "processing",
      "completed",
      "cancelled",
    ]);
  });

  it("does not include 'delivered' (dead code path, never submitted by UI)", () => {
    expect(FULFILLMENT_STATUSES).not.toContain("delivered");
  });

  it("is a readonly tuple — length is 4", () => {
    expect(FULFILLMENT_STATUSES.length).toBe(4);
  });
});

// ── isValidPaymentStatus ──────────────────────────────────────────────────────

describe("isValidPaymentStatus", () => {
  // All six stored payment-status values must be accepted.
  const validValues: string[] = [
    "pending",
    "cod_pending",
    "paid",
    "failed",
    "cancelled",
    "expired",
  ];

  for (const v of validValues) {
    it(`returns true for '${v}'`, () => {
      expect(isValidPaymentStatus(v)).toBe(true);
    });
  }

  it("returns false for 'cod_paid' (legacy query alias, not stored)", () => {
    expect(isValidPaymentStatus("cod_paid")).toBe(false);
  });

  it("returns false for unknown string 'refunded'", () => {
    expect(isValidPaymentStatus("refunded")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidPaymentStatus("")).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(isValidPaymentStatus("   ")).toBe(false);
  });

  it("returns false for a value with surrounding whitespace", () => {
    expect(isValidPaymentStatus(" paid ")).toBe(false);
  });

  it("returns false for uppercase variant", () => {
    expect(isValidPaymentStatus("PAID")).toBe(false);
  });

  it("returns false for mixed-case variant", () => {
    expect(isValidPaymentStatus("Paid")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isValidPaymentStatus(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidPaymentStatus(undefined)).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isValidPaymentStatus(1)).toBe(false);
  });

  it("returns false for an object", () => {
    expect(isValidPaymentStatus({ status: "paid" })).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isValidPaymentStatus(["paid"])).toBe(false);
  });

  it("returns false for SQL injection attempt", () => {
    expect(isValidPaymentStatus("paid'; DROP TABLE orders; --")).toBe(false);
  });

  it("acts as a type guard — narrows to PaymentStatus", () => {
    const raw: unknown = "paid";
    if (isValidPaymentStatus(raw)) {
      // TypeScript should accept this assignment without error.
      const typed: PaymentStatus = raw;
      expect(typed).toBe("paid");
    } else {
      throw new Error("Expected true");
    }
  });
});

// ── isAdminWritablePaymentStatus ──────────────────────────────────────────────

describe("isAdminWritablePaymentStatus", () => {
  // All five admin-writable values must be accepted.
  const writableValues: string[] = [
    "pending",
    "cod_pending",
    "paid",
    "failed",
    "cancelled",
  ];

  for (const v of writableValues) {
    it(`returns true for '${v}'`, () => {
      expect(isAdminWritablePaymentStatus(v)).toBe(true);
    });
  }

  it("returns false for 'expired' (cron-only, not admin-writable)", () => {
    expect(isAdminWritablePaymentStatus("expired")).toBe(false);
  });

  it("returns false for 'cod_paid'", () => {
    expect(isAdminWritablePaymentStatus("cod_paid")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isAdminWritablePaymentStatus("")).toBe(false);
  });

  it("returns false for whitespace", () => {
    expect(isAdminWritablePaymentStatus("   ")).toBe(false);
  });

  it("returns false for value with surrounding whitespace", () => {
    expect(isAdminWritablePaymentStatus(" paid ")).toBe(false);
  });

  it("returns false for uppercase variant", () => {
    expect(isAdminWritablePaymentStatus("PAID")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAdminWritablePaymentStatus(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAdminWritablePaymentStatus(undefined)).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isAdminWritablePaymentStatus(0)).toBe(false);
  });

  it("returns false for SQL injection attempt", () => {
    expect(isAdminWritablePaymentStatus("paid'; DROP TABLE orders; --")).toBe(
      false,
    );
  });

  it("acts as a type guard — narrows to AdminWritablePaymentStatus", () => {
    const raw: unknown = "cancelled";
    if (isAdminWritablePaymentStatus(raw)) {
      const typed: AdminWritablePaymentStatus = raw;
      expect(typed).toBe("cancelled");
    } else {
      throw new Error("Expected true");
    }
  });

  // Relationship to isValidPaymentStatus: every admin-writable value is also
  // a valid stored value, but not vice versa.
  it("every admin-writable value is also accepted by isValidPaymentStatus", () => {
    for (const v of ADMIN_WRITABLE_PAYMENT_STATUSES) {
      expect(isValidPaymentStatus(v)).toBe(true);
    }
  });

  it("'expired' is accepted by isValidPaymentStatus but NOT by isAdminWritablePaymentStatus", () => {
    expect(isValidPaymentStatus("expired")).toBe(true);
    expect(isAdminWritablePaymentStatus("expired")).toBe(false);
  });
});

// ── isValidFulfillmentStatus ──────────────────────────────────────────────────

describe("isValidFulfillmentStatus", () => {
  const validValues: string[] = [
    "pending",
    "processing",
    "completed",
    "cancelled",
  ];

  for (const v of validValues) {
    it(`returns true for '${v}'`, () => {
      expect(isValidFulfillmentStatus(v)).toBe(true);
    });
  }

  it("returns false for 'delivered' (dead code reference, not a stored value)", () => {
    expect(isValidFulfillmentStatus("delivered")).toBe(false);
  });

  it("returns false for 'paid' (payment status, not fulfillment)", () => {
    expect(isValidFulfillmentStatus("paid")).toBe(false);
  });

  it("returns false for 'cod_pending' (payment status, not fulfillment)", () => {
    expect(isValidFulfillmentStatus("cod_pending")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidFulfillmentStatus("")).toBe(false);
  });

  it("returns false for whitespace", () => {
    expect(isValidFulfillmentStatus("   ")).toBe(false);
  });

  it("returns false for uppercase variant", () => {
    expect(isValidFulfillmentStatus("PENDING")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isValidFulfillmentStatus(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidFulfillmentStatus(undefined)).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isValidFulfillmentStatus(42)).toBe(false);
  });

  it("acts as a type guard — narrows to FulfillmentStatus", () => {
    const raw: unknown = "processing";
    if (isValidFulfillmentStatus(raw)) {
      const typed: FulfillmentStatus = raw;
      expect(typed).toBe("processing");
    } else {
      throw new Error("Expected true");
    }
  });

  // Payment and fulfillment statuses are kept distinct — verify no cross-contamination.
  it("payment statuses and fulfillment statuses share only 'pending' and 'cancelled'", () => {
    const paymentSet = new Set<string>(PAYMENT_STATUSES);
    const fulfillmentSet = new Set<string>(FULFILLMENT_STATUSES);
    const overlap = [...paymentSet].filter((s) => fulfillmentSet.has(s));
    expect(overlap.sort()).toEqual(["cancelled", "pending"]);
  });
});

// ── FULFILLMENT_TRANSITIONS / isAllowedFulfillmentTransition — Phase 5 ────────

describe("FULFILLMENT_TRANSITIONS", () => {
  it("matches the locked Phase 5 matrix exactly", () => {
    expect(FULFILLMENT_TRANSITIONS).toEqual({
      pending: ["processing", "cancelled"],
      processing: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    });
  });

  it("completed and cancelled are terminal — no outbound transitions", () => {
    expect(FULFILLMENT_TRANSITIONS.completed).toEqual([]);
    expect(FULFILLMENT_TRANSITIONS.cancelled).toEqual([]);
  });
});

describe("isAllowedFulfillmentTransition", () => {
  const ALLOWED: [FulfillmentStatus, FulfillmentStatus][] = [
    ["pending", "processing"],
    ["pending", "cancelled"],
    ["processing", "completed"],
    ["processing", "cancelled"],
  ];
  const REJECTED: [FulfillmentStatus, FulfillmentStatus][] = [
    ["pending", "completed"], // decision 2
    ["processing", "pending"], // decision 3
    ["completed", "pending"],
    ["completed", "processing"],
    ["completed", "cancelled"], // terminal, decision 1
    ["cancelled", "pending"],
    ["cancelled", "processing"],
    ["cancelled", "completed"], // terminal, decision 1
  ];

  for (const [from, to] of ALLOWED) {
    it(`allows ${from} -> ${to}`, () => {
      expect(isAllowedFulfillmentTransition(from, to)).toBe(true);
    });
  }

  for (const [from, to] of REJECTED) {
    it(`rejects ${from} -> ${to}`, () => {
      expect(isAllowedFulfillmentTransition(from, to)).toBe(false);
    });
  }

  it("rejects every same-status pair (not itself a transition)", () => {
    for (const s of FULFILLMENT_STATUSES) {
      expect(isAllowedFulfillmentTransition(s, s)).toBe(false);
    }
  });
});

describe("isCustomerAllowedFulfillmentTransition — Phase 5 decision 8a/8b", () => {
  it("allows pending -> cancelled (decision 8b: customer self-cancel from pending)", () => {
    expect(isCustomerAllowedFulfillmentTransition("pending", "cancelled")).toBe(true);
  });

  it("rejects processing -> cancelled (decision 8b: customer self-cancel from processing is rejected, even though staff may do it per 8a)", () => {
    expect(isCustomerAllowedFulfillmentTransition("processing", "cancelled")).toBe(false);
  });

  it("rejects every other (from, to) pair, including ones staff may perform", () => {
    const staffOnlyOrInvalid: [FulfillmentStatus, FulfillmentStatus][] = [
      ["pending", "processing"],
      ["processing", "completed"],
      ["pending", "completed"],
      ["completed", "cancelled"],
      ["cancelled", "pending"],
    ];
    for (const [from, to] of staffOnlyOrInvalid) {
      expect(isCustomerAllowedFulfillmentTransition(from, to)).toBe(false);
    }
  });
});

describe("needsConfirmedShipmentBeforeProcessing — Phase 5 decisions 4/5/6", () => {
  it("blocks: online + courier snapshot + no shipment", () => {
    expect(
      needsConfirmedShipmentBeforeProcessing({
        orderChannel: "online",
        courierLabel: "Delhivery",
        hasShipment: false,
      }),
    ).toBe(true);
  });

  it("does not block: online + courier snapshot + confirmed shipment", () => {
    expect(
      needsConfirmedShipmentBeforeProcessing({
        orderChannel: "online",
        courierLabel: "Delhivery",
        hasShipment: true,
      }),
    ).toBe(false);
  });

  it("does not block: online with no courier snapshot at all (decision 6)", () => {
    expect(
      needsConfirmedShipmentBeforeProcessing({
        orderChannel: "online",
        courierLabel: null,
        hasShipment: false,
      }),
    ).toBe(false);
    expect(
      needsConfirmedShipmentBeforeProcessing({
        orderChannel: "online",
        courierLabel: undefined,
        hasShipment: false,
      }),
    ).toBe(false);
  });

  it("does not block: in-store, regardless of courier/shipment data", () => {
    expect(
      needsConfirmedShipmentBeforeProcessing({
        orderChannel: "in_store",
        courierLabel: null,
        hasShipment: false,
      }),
    ).toBe(false);
    expect(
      needsConfirmedShipmentBeforeProcessing({
        orderChannel: "in_store",
        courierLabel: "Delhivery", // in-store orders never carry courier data in practice, but the function must not gate on channel alone if it somehow did
        hasShipment: false,
      }),
    ).toBe(false);
  });
});
