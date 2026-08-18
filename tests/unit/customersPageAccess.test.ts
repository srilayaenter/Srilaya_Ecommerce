import { describe, it, expect } from "vitest";
import { isCustomersPageAllowed } from "../../apps/web/lib/pageAccess";

describe("isCustomersPageAllowed — owner-access fix", () => {
  it("allows owner (the fix)", () => {
    expect(isCustomersPageAllowed("owner")).toBe(true);
  });

  it("allows admin and manager (unchanged existing behavior)", () => {
    expect(isCustomersPageAllowed("admin")).toBe(true);
    expect(isCustomersPageAllowed("manager")).toBe(true);
  });

  it("rejects every other role (unchanged existing restriction)", () => {
    for (const role of ["inventory_staff", "billing_staff", "customer"]) {
      expect(isCustomersPageAllowed(role)).toBe(false);
    }
  });

  it("rejects unauthenticated / missing role", () => {
    expect(isCustomersPageAllowed(null)).toBe(false);
    expect(isCustomersPageAllowed(undefined)).toBe(false);
    expect(isCustomersPageAllowed("")).toBe(false);
  });
});
