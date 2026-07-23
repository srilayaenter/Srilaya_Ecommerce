import { describe, it, expect } from "vitest";
import {
  pointsEarned,
  pointsToRupees,
  maxRedeemablePoints,
  generateReferralCode,
} from "../../apps/web/lib/loyaltyMath";
import {
  POINTS_PER_RUPEE,
  RUPEES_PER_POINT,
  MAX_REDEEM_PCT,
  REFERRAL_BONUS,
} from "../../apps/web/lib/loyaltyConstants";

describe("pointsEarned", () => {
  it("earns 1 point per ₹10 spent", () => {
    expect(pointsEarned(100)).toBe(10);
    expect(pointsEarned(1000)).toBe(100);
  });

  it("floors partial points", () => {
    expect(pointsEarned(105)).toBe(10); // 10.5 → 10
    expect(pointsEarned(9)).toBe(0);    // 0.9 → 0
  });

  it("returns 0 for zero order", () => {
    expect(pointsEarned(0)).toBe(0);
  });
});

describe("pointsToRupees", () => {
  it("converts 10 points to ₹1", () => {
    expect(pointsToRupees(10)).toBe(1);
  });

  it("converts 100 points to ₹10", () => {
    expect(pointsToRupees(100)).toBe(10);
  });

  it("rounds to 2 decimal places", () => {
    expect(pointsToRupees(1)).toBe(0.1);
    expect(pointsToRupees(3)).toBe(0.3);
  });

  it("returns 0 for 0 points", () => {
    expect(pointsToRupees(0)).toBe(0);
  });
});

describe("maxRedeemablePoints", () => {
  it("caps at 10% of order total", () => {
    // ₹1000 order → max 10% = ₹100 → 100 / 0.1 = 1000 points
    expect(maxRedeemablePoints(1000, 5000)).toBe(1000);
  });

  it("caps at available balance when balance is lower", () => {
    expect(maxRedeemablePoints(1000, 200)).toBe(200);
  });

  it("returns 0 when balance is 0", () => {
    expect(maxRedeemablePoints(1000, 0)).toBe(0);
  });

  it("handles small orders correctly", () => {
    // ₹50 order → max ₹5 → 50 points; balance 1000
    expect(maxRedeemablePoints(50, 1000)).toBe(50);
  });
});

describe("generateReferralCode", () => {
  it("starts with SL-", () => {
    expect(generateReferralCode()).toMatch(/^SL-/);
  });

  it("is 9 characters total (SL- + 6 hex)", () => {
    expect(generateReferralCode()).toHaveLength(9);
  });

  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 100 }, generateReferralCode));
    expect(codes.size).toBe(100);
  });
});

describe("constants sanity", () => {
  it("1 point earned per ₹10", () => {
    expect(POINTS_PER_RUPEE).toBe(0.1);
  });

  it("10 points redeemable for ₹1", () => {
    expect(RUPEES_PER_POINT).toBe(0.1);
  });

  it("max redemption is 10% of order", () => {
    expect(MAX_REDEEM_PCT).toBe(10);
  });

  it("referral bonus is 50 points", () => {
    expect(REFERRAL_BONUS).toBe(50);
  });
});
