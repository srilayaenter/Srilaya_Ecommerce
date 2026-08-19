import { describe, it, expect } from "vitest";
import { resolveCostPriceForUpdate } from "../../apps/web/lib/costFieldAuthorization";

// This is the exact authorization boundary updateVariant (products/[id]/page.tsx)
// uses to decide whether a crafted request's costPrice field is persisted —
// extracted here solely so it's directly testable, per the approved scope.

describe("resolveCostPriceForUpdate — updateVariant's costPrice write authorization", () => {
  it("owner submit with costPrice present => costPrice included", () => {
    const result = resolveCostPriceForUpdate("owner", true, 42.5);
    expect(result).toEqual({ costPrice: 42.5 });
  });

  it("owner submit with costPrice present but zero/invalid => costPrice included as null", () => {
    expect(resolveCostPriceForUpdate("owner", true, 0)).toEqual({ costPrice: null });
    expect(resolveCostPriceForUpdate("owner", true, NaN)).toEqual({ costPrice: null });
  });

  it.each(["admin", "manager", "inventory_staff", "billing_staff", "customer"])(
    "%s submit with costPrice present (crafted) => costPrice omitted/ignored",
    (role) => {
      const result = resolveCostPriceForUpdate(role, true, 999.99);
      expect(result).toEqual({});
      expect(result).not.toHaveProperty("costPrice");
    }
  );

  it("unauthenticated (null/undefined role) submit with costPrice present => ignored", () => {
    expect(resolveCostPriceForUpdate(null, true, 50)).toEqual({});
    expect(resolveCostPriceForUpdate(undefined, true, 50)).toEqual({});
    expect(resolveCostPriceForUpdate("", true, 50)).toEqual({});
  });

  it("owner submit WITHOUT costPrice field present => no costPrice key at all (non-cost updates unaffected)", () => {
    const result = resolveCostPriceForUpdate("owner", false, 50);
    expect(result).toEqual({});
    expect(result).not.toHaveProperty("costPrice");
  });

  it("non-owner submit WITHOUT costPrice field present => no costPrice key (matches owner's no-field case, non-cost fields remain unaffected either way)", () => {
    const result = resolveCostPriceForUpdate("manager", false, 50);
    expect(result).toEqual({});
  });
});
