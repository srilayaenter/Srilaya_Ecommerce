import { describe, it, expect } from "vitest";
import { isLoyaltyPageAllowed } from "../../apps/web/lib/pageAccess";

describe("isLoyaltyPageAllowed — owner-access fix", () => {
  it("allows owner (the fix)", () => {
    expect(isLoyaltyPageAllowed("owner")).toBe(true);
  });

  it("allows admin and manager (unchanged existing behavior)", () => {
    expect(isLoyaltyPageAllowed("admin")).toBe(true);
    expect(isLoyaltyPageAllowed("manager")).toBe(true);
  });

  it("rejects every other role (unchanged existing restriction)", () => {
    for (const role of ["inventory_staff", "billing_staff", "customer"]) {
      expect(isLoyaltyPageAllowed(role)).toBe(false);
    }
  });

  it("rejects unauthenticated / missing role", () => {
    expect(isLoyaltyPageAllowed(null)).toBe(false);
    expect(isLoyaltyPageAllowed(undefined)).toBe(false);
    expect(isLoyaltyPageAllowed("")).toBe(false);
  });
});
