import { describe, it, expect } from "vitest";
import {
  computePlReport,
  isPlEligibleOrder,
  isPlEligibleRefund,
  istMonthStart,
  istMonthRange,
  type PlOrderInput,
  type PlRefundInput,
} from "../../apps/web/lib/plReport";

function order(overrides: Partial<PlOrderInput> = {}): PlOrderInput {
  return {
    id: "order-1",
    status: "paid",
    fulfillmentStatus: "completed",
    items: [{ variantId: "variant-1", quantity: 1, price: 200, costPrice: 120, productTitle: "Ragi Flakes 200g" }],
    ...overrides,
  };
}

// ── Revenue requires completed fulfillment AND paid status (Defect 2 fix) ────

describe("isPlEligibleOrder", () => {
  it("requires BOTH fulfillmentStatus === 'completed' AND status === 'paid'", () => {
    expect(isPlEligibleOrder({ status: "paid", fulfillmentStatus: "completed" })).toBe(true);
  });

  it("rejects completed-but-unpaid (policy #5)", () => {
    expect(isPlEligibleOrder({ status: "pending", fulfillmentStatus: "completed" })).toBe(false);
    expect(isPlEligibleOrder({ status: "cod_pending", fulfillmentStatus: "completed" })).toBe(false);
  });

  it("rejects paid-but-not-yet-completed (policy #4 — completed only, not processing)", () => {
    expect(isPlEligibleOrder({ status: "paid", fulfillmentStatus: "processing" })).toBe(false);
    expect(isPlEligibleOrder({ status: "paid", fulfillmentStatus: "pending" })).toBe(false);
  });

  it("rejects cancelled orders regardless of payment status", () => {
    expect(isPlEligibleOrder({ status: "paid", fulfillmentStatus: "cancelled" })).toBe(false);
  });

  it("REGRESSION GUARD: never matches the old broken filter's values ('delivered'/'completed' on the wrong field)", () => {
    // The historical defect checked Order.status (payment status) for
    // 'delivered'/'completed' — values that column can never hold. Confirm
    // the new predicate is keyed off the correct fields and doesn't
    // accidentally resurrect that bug.
    expect(isPlEligibleOrder({ status: "delivered" as any, fulfillmentStatus: "completed" })).toBe(false);
    expect(isPlEligibleOrder({ status: "completed" as any, fulfillmentStatus: "completed" })).toBe(false);
  });
});

// ── Core aggregation ────────────────────────────────────────────────────────────

describe("computePlReport — order inclusion", () => {
  it("a completed & paid order contributes real, nonzero revenue (closes the always-zero defect)", () => {
    const result = computePlReport({ orders: [order()], refunds: [], rawMaterialLogs: [] });
    expect(result.revenue).toBe(200);
    expect(result.totalOrders).toBe(1);
  });

  it("a processing (not yet completed) paid order is excluded", () => {
    const result = computePlReport({
      orders: [order({ fulfillmentStatus: "processing" })],
      refunds: [],
      rawMaterialLogs: [],
    });
    expect(result.revenue).toBe(0);
    expect(result.totalOrders).toBe(0);
  });

  it("a completed but unpaid order is excluded", () => {
    const result = computePlReport({
      orders: [order({ status: "cod_pending" })],
      refunds: [],
      rawMaterialLogs: [],
    });
    expect(result.revenue).toBe(0);
  });

  it("zero matching orders in period → zero revenue/profit, no NaN or Infinity", () => {
    const result = computePlReport({ orders: [], refunds: [], rawMaterialLogs: [] });
    expect(result.revenue).toBe(0);
    expect(result.cogs).toBe(0);
    expect(result.grossProfit).toBe(0);
    expect(result.netProfit).toBe(0);
    expect(Number.isFinite(result.grossMargin)).toBe(true);
    expect(Number.isFinite(result.netMargin)).toBe(true);
    expect(result.grossMargin).toBe(0);
    expect(result.netMargin).toBe(0);
  });

  it("COGS computed from live costPrice; missing cost is flagged, not silently zero-hidden", () => {
    const result = computePlReport({
      orders: [order({ items: [{ variantId: "v1", quantity: 2, price: 100, costPrice: null, productTitle: "No Cost Item" }] })],
      refunds: [],
      rawMaterialLogs: [],
    });
    expect(result.cogs).toBe(0);
    expect(result.missingCostLineCount).toBe(1);
    expect(result.byProduct[0].missingCost).toBe(true);
  });

  it("multiple products/quantities aggregate correctly", () => {
    const result = computePlReport({
      orders: [
        order({
          items: [
            { variantId: "v1", quantity: 2, price: 100, costPrice: 60, productTitle: "A" },
            { variantId: "v2", quantity: 3, price: 50, costPrice: 20, productTitle: "B" },
          ],
        }),
      ],
      refunds: [],
      rawMaterialLogs: [],
    });
    expect(result.revenue).toBe(200 + 150); // 350
    expect(result.cogs).toBe(120 + 60); // 180
    expect(result.byProduct).toHaveLength(2);
  });
});

// ── Returns counted only at 'refunded' (Defect 3 fix, policy #6) ─────────────

describe("isPlEligibleRefund / return inclusion", () => {
  it("counts only status === 'refunded'", () => {
    expect(isPlEligibleRefund({ status: "refunded" })).toBe(true);
    for (const status of ["requested", "approved", "received", "rejected", "completed"]) {
      expect(isPlEligibleRefund({ status })).toBe(false);
    }
  });

  it("computePlReport includes a refunded return's value and excludes non-refunded ones", () => {
    const baseRefund: Omit<PlRefundInput, "status"> = {
      orderId: "order-1",
      items: [{ variantId: "variant-1", quantity: 1 }],
      orderItems: [{ variantId: "variant-1", price: 200 }],
    };
    const result = computePlReport({
      orders: [order()],
      refunds: [
        { ...baseRefund, status: "refunded" },
      ],
      rawMaterialLogs: [],
    });
    expect(result.returnValue).toBe(200);
    expect(result.totalReturns).toBe(1);
  });

  it("a return still 'approved' (not yet refunded) does not affect returnValue", () => {
    const result = computePlReport({
      orders: [order()],
      refunds: [
        { orderId: "order-1", status: "approved", items: [{ variantId: "variant-1", quantity: 1 }], orderItems: [{ variantId: "variant-1", price: 200 }] },
      ],
      rawMaterialLogs: [],
    });
    expect(result.returnValue).toBe(0);
    expect(result.totalReturns).toBe(0);
  });

  it("a refund against an order not included in revenue (e.g. not completed) has no effect", () => {
    const result = computePlReport({
      orders: [order({ fulfillmentStatus: "processing" })], // excluded from revenue
      refunds: [
        { orderId: "order-1", status: "refunded", items: [{ variantId: "variant-1", quantity: 1 }], orderItems: [{ variantId: "variant-1", price: 200 }] },
      ],
      rawMaterialLogs: [],
    });
    expect(result.returnValue).toBe(0);
  });
});

// ── Live-cost COGS: no schema change, disclosure is a UI concern — this test
// documents the CONTRACT that costPrice is read as-given (live), not snapshotted ─

describe("computePlReport — live-cost COGS behavior (documents the known limitation)", () => {
  it("uses whatever costPrice is passed in — the caller is responsible for it being 'live', not historical", () => {
    const resultA = computePlReport({
      orders: [order({ items: [{ variantId: "v1", quantity: 1, price: 200, costPrice: 100, productTitle: "X" }] })],
      refunds: [],
      rawMaterialLogs: [],
    });
    const resultB = computePlReport({
      orders: [order({ items: [{ variantId: "v1", quantity: 1, price: 200, costPrice: 150, productTitle: "X" }] })],
      refunds: [],
      rawMaterialLogs: [],
    });
    // Same order, different costPrice passed in (simulating "cost price changed
    // since the sale") produces a different COGS — proves there is no
    // historical snapshot; the module has no memory of past cost.
    expect(resultA.cogs).toBe(100);
    expect(resultB.cogs).toBe(150);
    expect(resultA.cogs).not.toBe(resultB.cogs);
  });
});

// ── Shipping exclusion (policy #7/#8) ─────────────────────────────────────────

describe("computePlReport — shipping and other-expense scope guard", () => {
  it("output has no shipping income/expense or payment-fee fields (regression guard against scope creep)", () => {
    const result = computePlReport({ orders: [order()], refunds: [], rawMaterialLogs: [] });
    expect(result).not.toHaveProperty("shippingIncome");
    expect(result).not.toHaveProperty("shippingExpense");
    expect(result).not.toHaveProperty("paymentFees");
    expect(result).not.toHaveProperty("otherExpenses");
  });

  it("revenue is computed purely from item price × qty — shipping fee is never part of it", () => {
    // computePlReport's PlOrderInput has no shippingFee field at all — this
    // test documents that shipping literally cannot leak into revenue since
    // the type doesn't carry it.
    const result = computePlReport({ orders: [order()], refunds: [], rawMaterialLogs: [] });
    expect(result.revenue).toBe(200); // exactly item price × qty, nothing added
  });
});

// ── Raw material production cost (unaffected by the order-query fix) ────────

describe("computePlReport — raw material cost", () => {
  it("aggregates production log consumption independently of order revenue", () => {
    const result = computePlReport({
      orders: [],
      refunds: [],
      rawMaterialLogs: [{ materialName: "Ragi", unit: "kg", qty: -5, costPerUnit: 40 }],
    });
    expect(result.rawMatCost).toBe(200);
    expect(result.rawMatMissingCost).toBe(false);
  });

  it("flags missing cost-per-unit", () => {
    const result = computePlReport({
      orders: [],
      refunds: [],
      rawMaterialLogs: [{ materialName: "Ragi", unit: "kg", qty: -5, costPerUnit: null }],
    });
    expect(result.rawMatCost).toBe(0);
    expect(result.rawMatMissingCost).toBe(true);
  });
});

// ── Sum-then-round behavior ────────────────────────────────────────────────────

describe("computePlReport — rounding order", () => {
  it("rounds only the final aggregate, not each intermediate line", () => {
    const result = computePlReport({
      orders: [
        order({
          items: [
            { variantId: "v1", quantity: 1, price: 100.01, costPrice: 60.005, productTitle: "A" },
            { variantId: "v2", quantity: 1, price: 99.99, costPrice: 59.995, productTitle: "B" },
          ],
        }),
      ],
      refunds: [],
      rawMaterialLogs: [],
    });
    expect(result.revenue).toBe(200);
    expect(result.cogs).toBe(120);
  });
});

// ── IST boundaries (shared helper — sanity check, full coverage in gstReport.test.ts) ──

describe("plReport re-exports the shared IST helpers", () => {
  it("istMonthStart/istMonthRange are available and behave identically to gstReport's", () => {
    expect(istMonthStart(2026, 8).toISOString()).toBe("2026-07-31T18:30:00.000Z");
    const { from, to } = istMonthRange(2026, 8);
    expect(from < to).toBe(true);
  });
});
