import { describe, it, expect } from "vitest";
import { calcCouponDiscount, calcOrderTotal } from "../../apps/web/lib/pricing";

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
