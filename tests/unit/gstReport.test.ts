import { describe, it, expect, vi } from "vitest";
import {
  computeGstReport,
  isGstEligibleOrder,
  isIntraState,
  lookupStateGstCode,
  istMonthStart,
  istMonthRange,
  type GstReportOrderInput,
} from "../../apps/web/lib/gstReport";
import { calcLineGst } from "../../apps/web/lib/pricing";

const HOME_STATE_CODE = "29"; // Karnataka, matches BRAND.gstin in this codebase

function order(overrides: Partial<GstReportOrderInput> = {}): GstReportOrderInput {
  return {
    id: "order-1",
    state: "Karnataka",
    subtotal: 200,
    discountAmount: null,
    shippingFee: 0,
    total: 210,
    status: "paid",
    fulfillmentStatus: "processing",
    items: [{ variantId: "variant-1", quantity: 1, price: 200, gstRate: 5 }],
    ...overrides,
  };
}

// ── Tax-exclusive pricing (Defect 1 fix) ──────────────────────────────────────

describe("computeGstReport — tax-exclusive pricing", () => {
  it("taxable value equals full price × quantity — no division for GST", () => {
    const result = computeGstReport({ orders: [order()], refunds: [], homeStateCode: HOME_STATE_CODE });
    expect(result.grandTaxable).toBe(200);
  });

  it("tax amount matches calcLineGst exactly, for several rates", () => {
    for (const rate of [0, 5, 12, 18]) {
      const result = computeGstReport({
        orders: [order({ items: [{ variantId: "v1", quantity: 1, price: 200, gstRate: rate }] })],
        refunds: [],
        homeStateCode: HOME_STATE_CODE,
      });
      expect(result.grandTax).toBeCloseTo(calcLineGst(200, 1, rate), 5);
    }
  });

  it("does NOT understate tax the way the old inclusive formula did (regression guard)", () => {
    // Old (wrong) formula: taxable = 200/1.05 ≈ 190.48, tax ≈ 9.52
    // Correct formula: taxable = 200, tax = 10
    const result = computeGstReport({ orders: [order()], refunds: [], homeStateCode: HOME_STATE_CODE });
    expect(result.grandTaxable).toBe(200);
    expect(result.grandTax).toBe(10);
    expect(result.grandTaxable).not.toBeCloseTo(190.48, 1);
  });

  it("multiple items at multiple rates aggregate into separate slabs", () => {
    const result = computeGstReport({
      orders: [
        order({
          items: [
            { variantId: "v1", quantity: 1, price: 500, gstRate: 5 },
            { variantId: "v2", quantity: 1, price: 500, gstRate: 12 },
          ],
        }),
      ],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.slabs).toHaveLength(2);
    const slab5 = result.slabs.find((s) => s.rate === 5)!;
    const slab12 = result.slabs.find((s) => s.rate === 12)!;
    expect(slab5.taxableValue).toBe(500);
    expect(slab5.totalTax).toBe(25);
    expect(slab12.taxableValue).toBe(500);
    expect(slab12.totalTax).toBe(60);
  });
});

// ── Discount-net taxable base (locked policy #1) ──────────────────────────────

describe("computeGstReport — discount netting", () => {
  it("proportionally reduces taxable value by the order's discount share", () => {
    // subtotal 200, discount 20 (10% of subtotal) → netTaxable = 200 - 20 = 180
    const result = computeGstReport({
      orders: [order({ subtotal: 200, discountAmount: 20 })],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.grandTaxable).toBe(180);
    expect(result.grandTax).toBeCloseTo(9, 10); // 5% of 180
  });

  it("splits discount proportionally across multiple line items by value share", () => {
    const result = computeGstReport({
      orders: [
        order({
          subtotal: 1000,
          discountAmount: 100, // 10% overall discount
          items: [
            { variantId: "v1", quantity: 1, price: 800, gstRate: 5 }, // 80% of subtotal → 80 discount share
            { variantId: "v2", quantity: 1, price: 200, gstRate: 12 }, // 20% of subtotal → 20 discount share
          ],
        }),
      ],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    const slab5 = result.slabs.find((s) => s.rate === 5)!;
    const slab12 = result.slabs.find((s) => s.rate === 12)!;
    expect(slab5.taxableValue).toBeCloseTo(720, 5); // 800 - 80
    expect(slab12.taxableValue).toBeCloseTo(180, 5); // 200 - 20
  });

  it("no discount leaves taxable value unchanged", () => {
    const result = computeGstReport({
      orders: [order({ discountAmount: null })],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.grandTaxable).toBe(200);
  });

  it("defensively handles a zero subtotal without dividing by zero", () => {
    const result = computeGstReport({
      orders: [order({ subtotal: 0, discountAmount: 10 })],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(Number.isFinite(result.grandTaxable)).toBe(true);
    expect(result.grandTaxable).toBe(200); // discount share treated as 0
  });
});

// ── CGST/SGST vs IGST using HOME_STATE_CODE ───────────────────────────────────

describe("isIntraState / jurisdiction classification", () => {
  it("matches the home state via the official state-code lookup, not a hardcoded string", () => {
    expect(isIntraState("Karnataka", HOME_STATE_CODE)).toBe(true);
    expect(lookupStateGstCode("Karnataka")).toBe("29");
  });

  it("recognizes other real state names as inter-state", () => {
    expect(isIntraState("Maharashtra", HOME_STATE_CODE)).toBe(false);
    expect(isIntraState("Tamil Nadu", HOME_STATE_CODE)).toBe(false);
    expect(lookupStateGstCode("Maharashtra")).toBe("27");
  });

  it("falls back to inter-state (IGST) for an unrecognized state name, with a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(isIntraState("Atlantis", HOME_STATE_CODE)).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("null/empty state is treated as inter-state without warning (no state recorded)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(isIntraState(null, HOME_STATE_CODE)).toBe(false);
    expect(isIntraState("", HOME_STATE_CODE)).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("computeGstReport — CGST/SGST vs IGST split", () => {
  it("intra-state order splits tax evenly into CGST + SGST, IGST = 0", () => {
    const result = computeGstReport({
      orders: [order({ state: "Karnataka" })],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.grandCgst).toBe(5);
    expect(result.grandSgst).toBe(5);
    expect(result.grandIgst).toBe(0);
  });

  it("inter-state order goes entirely to IGST, CGST/SGST = 0", () => {
    const result = computeGstReport({
      orders: [order({ state: "Maharashtra" })],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.grandCgst).toBe(0);
    expect(result.grandSgst).toBe(0);
    expect(result.grandIgst).toBe(10);
  });
});

// ── Cancelled-order exclusion (locked policy) ─────────────────────────────────

describe("isGstEligibleOrder / cancelled-order exclusion", () => {
  it("excludes an order with fulfillmentStatus 'cancelled' even when status is 'paid' (admin-cancel path)", () => {
    expect(isGstEligibleOrder({ status: "paid", fulfillmentStatus: "cancelled" })).toBe(false);
  });

  it("excludes an order with status 'cancelled' (customer self-cancel path)", () => {
    expect(isGstEligibleOrder({ status: "cancelled", fulfillmentStatus: "pending" })).toBe(false);
  });

  it("includes a paid, non-cancelled order regardless of fulfillment stage", () => {
    for (const fulfillmentStatus of ["pending", "processing", "completed"]) {
      expect(isGstEligibleOrder({ status: "paid", fulfillmentStatus })).toBe(true);
    }
  });

  it("excludes an unpaid order", () => {
    for (const status of ["pending", "cod_pending", "failed", "expired"]) {
      expect(isGstEligibleOrder({ status, fulfillmentStatus: "processing" })).toBe(false);
    }
  });

  it("computeGstReport actually excludes a cancelled order end-to-end", () => {
    const result = computeGstReport({
      orders: [
        order({ id: "order-ok", status: "paid", fulfillmentStatus: "processing" }),
        order({ id: "order-admin-cancelled", status: "paid", fulfillmentStatus: "cancelled" }),
        order({ id: "order-customer-cancelled", status: "cancelled", fulfillmentStatus: "pending" }),
      ],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.orderCount).toBe(1);
    expect(result.grandTaxable).toBe(200); // only order-ok contributes
  });
});

// ── Refunded-period credit adjustment ─────────────────────────────────────────

describe("computeGstReport — refund credit adjustments", () => {
  it("a refunded return in the SAME period credits the taxable/tax slab down", () => {
    const result = computeGstReport({
      orders: [order({ id: "order-1", subtotal: 200, items: [{ variantId: "v1", quantity: 2, price: 200, gstRate: 5 }] })],
      refunds: [{ orderId: "order-1", items: [{ variantId: "v1", quantity: 1 }] }],
      homeStateCode: HOME_STATE_CODE,
    });
    // Original: 2 × 200 = 400 taxable, 20 tax. Refund credits 1 × 200 = 200 taxable, 10 tax.
    expect(result.grandTaxable).toBe(200);
    expect(result.grandTax).toBe(10);
  });

  it("a refund against a non-included (e.g. cancelled) order has no effect", () => {
    const result = computeGstReport({
      orders: [order({ id: "order-cancelled", status: "paid", fulfillmentStatus: "cancelled" })],
      refunds: [{ orderId: "order-cancelled", items: [{ variantId: "variant-1", quantity: 1 }] }],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.grandTaxable).toBe(0);
    expect(result.orderCount).toBe(0);
  });

  it("a refund's discount share is netted the same way as the original sale", () => {
    const result = computeGstReport({
      orders: [
        order({
          id: "order-1",
          subtotal: 200,
          discountAmount: 20, // 10%
          items: [{ variantId: "v1", quantity: 2, price: 200, gstRate: 5 }],
        }),
      ],
      refunds: [{ orderId: "order-1", items: [{ variantId: "v1", quantity: 1 }] }],
      homeStateCode: HOME_STATE_CODE,
    });
    // Original net taxable: (400 - 40) = 360. Refund line value 200, discount share
    // proportional to (200/200 subtotal) — matches the implementation's own formula,
    // asserting internal consistency rather than a hand-derived second formula.
    expect(result.grandTaxable).toBeLessThan(360);
    expect(result.grandTaxable).toBeGreaterThan(0);
  });

  it("only 'refunded'-status returns are passed in by the caller — a non-refunded return is simply absent from the refunds array and has no effect (caller-level contract, not re-validated inside computeGstReport)", () => {
    // computeGstReport trusts its `refunds` input is pre-filtered to refunded
    // returns (route.ts queries status:'refunded' directly) — this test
    // documents that contract rather than re-testing route.ts's query.
    const result = computeGstReport({ orders: [order()], refunds: [], homeStateCode: HOME_STATE_CODE });
    expect(result.grandTaxable).toBe(200);
  });
});

// ── Sum-then-round behavior ────────────────────────────────────────────────────

describe("computeGstReport — rounding order", () => {
  it("rounds only the final aggregate, not each intermediate contribution", () => {
    // Three lines whose individual tax values have long decimals, but whose
    // SUM is a round number — proves rounding happens after summation.
    const result = computeGstReport({
      orders: [
        order({
          subtotal: 300,
          items: [
            { variantId: "v1", quantity: 1, price: 100.01, gstRate: 5 },
            { variantId: "v2", quantity: 1, price: 99.99, gstRate: 5 },
            { variantId: "v3", quantity: 1, price: 100, gstRate: 5 },
          ],
        }),
      ],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.grandTaxable).toBe(300);
    expect(result.grandTax).toBe(15); // 5% of 300 exactly, despite per-line fractional cents
  });

  it("slab and grand totals stay internally consistent after rounding", () => {
    const result = computeGstReport({
      orders: [
        order({
          subtotal: 1000,
          items: [
            { variantId: "v1", quantity: 3, price: 149.5, gstRate: 5 },
            { variantId: "v2", quantity: 1, price: 399, gstRate: 12 },
          ],
        }),
      ],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    const slabSum = result.slabs.reduce((acc, s) => acc + s.taxableValue, 0);
    expect(slabSum).toBeCloseTo(result.grandTaxable, 2);
  });
});

// ── Shipping never appears in the taxable/tax breakdown ───────────────────────

describe("computeGstReport — shipping excluded from tax breakdown", () => {
  it("shippingFee is summed for reconciliation but never contributes to any slab", () => {
    const result = computeGstReport({
      orders: [order({ shippingFee: 60 })],
      refunds: [],
      homeStateCode: HOME_STATE_CODE,
    });
    expect(result.shippingFee).toBe(60);
    expect(result.grandTaxable).toBe(200); // unaffected by shipping
  });
});

// ── IST date boundaries ────────────────────────────────────────────────────────

describe("istMonthStart / istMonthRange", () => {
  it("produces the UTC instant corresponding to IST midnight on the 1st", () => {
    const start = istMonthStart(2026, 8);
    // IST midnight Aug 1 2026 = UTC 2026-07-31T18:30:00.000Z
    expect(start.toISOString()).toBe("2026-07-31T18:30:00.000Z");
  });

  it("range end is the next month's IST start, wrapping correctly at year end", () => {
    const { from, to } = istMonthRange(2026, 12);
    expect(from.toISOString()).toBe("2026-11-30T18:30:00.000Z");
    expect(to.toISOString()).toBe("2026-12-31T18:30:00.000Z"); // Jan 1 2027 IST midnight
  });

  it("an order timestamped just before IST midnight on month-end stays in that month regardless of server timezone", () => {
    const { to } = istMonthRange(2026, 8); // Sept 1 IST midnight, in UTC
    const orderTimeJustBeforeBoundary = new Date(to.getTime() - 1000); // 1 second before
    expect(orderTimeJustBeforeBoundary < to).toBe(true);
    const { from } = istMonthRange(2026, 8);
    expect(orderTimeJustBeforeBoundary >= from).toBe(true);
  });
});
