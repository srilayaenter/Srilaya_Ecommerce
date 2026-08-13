import { describe, it, expect } from "vitest";
import {
  POINTS_PER_RUPEE,
  RUPEES_PER_POINT,
  MIN_REDEEM_POINTS,
  MAX_REDEEM_PCT,
  REFERRAL_BONUS,
  pointsToRupees,
  maxRedeemablePoints,
} from "../../apps/web/lib/loyaltyConstants";

// ── constant sanity ───────────────────────────────────────────────────────────

describe("loyalty constants", () => {
  it("POINTS_PER_RUPEE is 0.1 (1 point per ₹10)", () => {
    expect(POINTS_PER_RUPEE).toBe(0.1);
  });

  it("RUPEES_PER_POINT is 0.1 (10 points = ₹1)", () => {
    expect(RUPEES_PER_POINT).toBe(0.1);
  });

  it("MIN_REDEEM_POINTS is 100", () => {
    expect(MIN_REDEEM_POINTS).toBe(100);
  });

  it("MAX_REDEEM_PCT is 10", () => {
    expect(MAX_REDEEM_PCT).toBe(10);
  });

  it("REFERRAL_BONUS is 50", () => {
    expect(REFERRAL_BONUS).toBe(50);
  });

  it("POINTS_PER_RUPEE × RUPEES_PER_POINT = 1 (consistent inverse)", () => {
    expect(POINTS_PER_RUPEE / RUPEES_PER_POINT).toBeCloseTo(1, 10);
  });
});

// ── pointsToRupees ────────────────────────────────────────────────────────────

describe("pointsToRupees", () => {
  it("100 points → ₹10.00", () => {
    expect(pointsToRupees(100)).toBe(10);
  });

  it("10 points → ₹1.00", () => {
    expect(pointsToRupees(10)).toBe(1);
  });

  it("0 points → ₹0.00", () => {
    expect(pointsToRupees(0)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    // 1 point = ₹0.10; 3 points = ₹0.30 (exact)
    expect(pointsToRupees(3)).toBe(0.3);
  });

  it("1000 points → ₹100.00", () => {
    expect(pointsToRupees(1000)).toBe(100);
  });

  it("50 points (REFERRAL_BONUS) → ₹5.00", () => {
    expect(pointsToRupees(REFERRAL_BONUS)).toBe(5);
  });
});

// ── maxRedeemablePoints ───────────────────────────────────────────────────────

describe("maxRedeemablePoints", () => {
  it("caps at MAX_REDEEM_PCT% of order value (converted to points)", () => {
    // ₹1000 order, 10% = ₹100 = 1000 points; balance is 2000
    expect(maxRedeemablePoints(1000, 2000)).toBe(1000);
  });

  it("caps at balance when balance is lower than order-cap", () => {
    // ₹1000 order → max 1000 points; balance is only 200
    expect(maxRedeemablePoints(1000, 200)).toBe(200);
  });

  it("returns 0 when balance is 0", () => {
    expect(maxRedeemablePoints(500, 0)).toBe(0);
  });

  it("returns 0 when orderTotal is 0", () => {
    expect(maxRedeemablePoints(0, 500)).toBe(0);
  });

  it("floors the order-cap (no fractional points)", () => {
    // ₹105 order → 10% = ₹10.5 = 105 points; Math.floor → 105
    expect(Number.isInteger(maxRedeemablePoints(105, 9999))).toBe(true);
  });

  it("small order with large balance → order-cap wins", () => {
    // ₹50 order → 10% = ₹5 = 50 points; balance is 9999
    expect(maxRedeemablePoints(50, 9999)).toBe(50);
  });
});
