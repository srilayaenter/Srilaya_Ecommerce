import { describe, it, expect } from "vitest";
import {
  calcCouponDiscount,
  calcOrderTotal,
  calcLineGst,
  calcLineTotal,
  calcOrderSubtotals,
} from "../../apps/web/lib/pricing";

// ── calcLineGst ───────────────────────────────────────────────────────────────

describe("calcLineGst", () => {
  it("5% GST on ₹100 × 1 → ₹5", () => {
    expect(calcLineGst(100, 1, 5)).toBe(5);
  });

  it("12% GST on ₹200 × 2 → ₹48", () => {
    expect(calcLineGst(200, 2, 12)).toBe(48);
  });

  it("0% GST → ₹0", () => {
    expect(calcLineGst(500, 3, 0)).toBe(0);
  });

  it("18% GST on ₹100 × 1 → ₹18", () => {
    expect(calcLineGst(100, 1, 18)).toBe(18);
  });
});

// ── calcLineTotal ─────────────────────────────────────────────────────────────

describe("calcLineTotal", () => {
  it("₹100 × 2 at 5% GST → ₹210", () => {
    expect(calcLineTotal(100, 2, 5)).toBe(210);
  });

  it("₹500 × 1 at 0% GST → ₹500", () => {
    expect(calcLineTotal(500, 1, 0)).toBe(500);
  });

  it("₹250 × 3 at 12% GST → ₹840", () => {
    expect(calcLineTotal(250, 3, 12)).toBe(840);
  });
});

// ── calcOrderSubtotals ────────────────────────────────────────────────────────

describe("calcOrderSubtotals", () => {
  it("single item, no GST", () => {
    const result = calcOrderSubtotals([{ price: 500, quantity: 1, gstRate: 0 }]);
    expect(result.subtotal).toBe(500);
    expect(result.taxTotal).toBe(0);
    expect(result.grandTotal).toBe(500);
  });

  it("single item with 5% GST", () => {
    const result = calcOrderSubtotals([{ price: 200, quantity: 2, gstRate: 5 }]);
    expect(result.subtotal).toBe(400);
    expect(result.taxTotal).toBe(20);
    expect(result.grandTotal).toBe(420);
  });

  it("multiple items with mixed GST rates", () => {
    const items = [
      { price: 100, quantity: 2, gstRate: 5 },   // subtotal 200, gst 10
      { price: 300, quantity: 1, gstRate: 12 },   // subtotal 300, gst 36
    ];
    const result = calcOrderSubtotals(items);
    expect(result.subtotal).toBe(500);
    expect(result.taxTotal).toBe(46);
    expect(result.grandTotal).toBe(546);
  });

  it("empty cart → all zeros", () => {
    const result = calcOrderSubtotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.taxTotal).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  it("grandTotal = subtotal + taxTotal always", () => {
    const items = [
      { price: 149, quantity: 3, gstRate: 5 },
      { price: 499, quantity: 2, gstRate: 12 },
      { price: 899, quantity: 1, gstRate: 18 },
    ];
    const result = calcOrderSubtotals(items);
    expect(result.grandTotal).toBeCloseTo(result.subtotal + result.taxTotal, 10);
  });

  it("does not include shipping (shipping is separate)", () => {
    // grandTotal from this function is pre-shipping
    const result = calcOrderSubtotals([{ price: 500, quantity: 1, gstRate: 5 }]);
    expect(result.grandTotal).toBe(525); // no shipping added
  });
});

// ── calcCouponDiscount ────────────────────────────────────────────────────────

describe("calcCouponDiscount", () => {
  describe("percentage coupons", () => {
    it("applies percentage correctly", () => {
      expect(calcCouponDiscount(1000, { type: "percentage", value: 10 })).toBe(100);
      expect(calcCouponDiscount(500, { type: "percentage", value: 20 })).toBe(100);
    });

    it("rounds to 2 decimal places", () => {
      // 10% of 333 = 33.3 → 33.3
      expect(calcCouponDiscount(333, { type: "percentage", value: 10 })).toBe(33.3);
    });

    it("handles string value from DB", () => {
      expect(calcCouponDiscount(1000, { type: "percentage", value: "15" })).toBe(150);
    });

    it("handles 100% coupon (full order)", () => {
      expect(calcCouponDiscount(500, { type: "percentage", value: 100 })).toBe(500);
    });
  });

  describe("flat coupons", () => {
    it("deducts flat amount", () => {
      expect(calcCouponDiscount(1000, { type: "flat", value: 50 })).toBe(50);
    });

    it("caps at order total — never goes negative", () => {
      expect(calcCouponDiscount(30, { type: "flat", value: 100 })).toBe(30);
    });

    it("handles string value from DB", () => {
      expect(calcCouponDiscount(500, { type: "flat", value: "75" })).toBe(75);
    });
  });
});

describe("calcOrderTotal", () => {
  it("subtracts loyalty and coupon discounts", () => {
    expect(calcOrderTotal(1000, 10, 100)).toBe(890);
  });

  it("never returns negative", () => {
    expect(calcOrderTotal(100, 60, 60)).toBe(0);
    expect(calcOrderTotal(0, 0, 0)).toBe(0);
  });

  it("works with no discounts", () => {
    expect(calcOrderTotal(1500, 0, 0)).toBe(1500);
  });

  it("handles floating point sums correctly", () => {
    // ₹999.99 order, ₹9.99 loyalty, ₹99.99 coupon
    expect(calcOrderTotal(999.99, 9.99, 99.99)).toBeCloseTo(890.01, 2);
  });
});
