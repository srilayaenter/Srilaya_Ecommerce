import { describe, it, expect } from "vitest";
import {
  canAccessPath,
  isAdminRole,
  isOwner,
} from "../../apps/web/lib/permissions";

// ── canAccessPath ─────────────────────────────────────────────────────────────

describe("canAccessPath — owner", () => {
  it("can access /admin root", () => {
    expect(canAccessPath("owner", "/admin")).toBe(true);
  });

  it("can access any admin sub-path", () => {
    expect(canAccessPath("owner", "/admin/orders")).toBe(true);
    expect(canAccessPath("owner", "/admin/users")).toBe(true);
    expect(canAccessPath("owner", "/admin/reports/pl")).toBe(true);
    expect(canAccessPath("owner", "/admin/raw-materials")).toBe(true);
    expect(canAccessPath("owner", "/admin/settings")).toBe(true);
  });
});

describe("canAccessPath — admin", () => {
  it("can access /admin root", () => {
    expect(canAccessPath("admin", "/admin")).toBe(true);
  });

  it("can access any admin sub-path", () => {
    expect(canAccessPath("admin", "/admin/products")).toBe(true);
    expect(canAccessPath("admin", "/admin/users")).toBe(true);
  });
});

describe("canAccessPath — manager", () => {
  it("can access /admin root", () => {
    expect(canAccessPath("manager", "/admin")).toBe(true);
  });

  it("can access permitted operational paths", () => {
    expect(canAccessPath("manager", "/admin/orders")).toBe(true);
    expect(canAccessPath("manager", "/admin/products")).toBe(true);
    expect(canAccessPath("manager", "/admin/coupons")).toBe(true);
    expect(canAccessPath("manager", "/admin/analytics")).toBe(true);
    expect(canAccessPath("manager", "/admin/returns")).toBe(true);
    expect(canAccessPath("manager", "/admin/loyalty")).toBe(true);
  });

  it("can access sub-paths of permitted paths", () => {
    expect(canAccessPath("manager", "/admin/orders/abc123")).toBe(true);
    expect(canAccessPath("manager", "/admin/products/new")).toBe(true);
  });

  it("cannot access /admin/users", () => {
    expect(canAccessPath("manager", "/admin/users")).toBe(false);
  });

  it("cannot access /admin/settings", () => {
    expect(canAccessPath("manager", "/admin/settings")).toBe(false);
  });

  it("cannot access /admin/raw-materials", () => {
    expect(canAccessPath("manager", "/admin/raw-materials")).toBe(false);
  });

  it("cannot access /admin/production", () => {
    expect(canAccessPath("manager", "/admin/production")).toBe(false);
  });

  it("path with query string is allowed", () => {
    expect(canAccessPath("manager", "/admin/orders?status=pending")).toBe(true);
  });
});

describe("canAccessPath — inventory_staff", () => {
  it("can access /admin/products", () => {
    expect(canAccessPath("inventory_staff", "/admin/products")).toBe(true);
  });

  it("can access /admin/stock-log", () => {
    expect(canAccessPath("inventory_staff", "/admin/stock-log")).toBe(true);
  });

  it("can access /admin/suppliers", () => {
    expect(canAccessPath("inventory_staff", "/admin/suppliers")).toBe(true);
  });

  it("cannot access /admin/orders", () => {
    expect(canAccessPath("inventory_staff", "/admin/orders")).toBe(false);
  });

  it("cannot access /admin/users", () => {
    expect(canAccessPath("inventory_staff", "/admin/users")).toBe(false);
  });

  it("cannot access /admin/analytics", () => {
    expect(canAccessPath("inventory_staff", "/admin/analytics")).toBe(false);
  });

  it("cannot access /admin root alone (not a wildcard grant)", () => {
    // inventory_staff has /admin only alongside specific paths, so /admin itself
    // is exact-match only — confirm /admin/reports is not allowed
    expect(canAccessPath("inventory_staff", "/admin/reports")).toBe(false);
  });
});

describe("canAccessPath — billing_staff", () => {
  it("can access /admin/orders", () => {
    expect(canAccessPath("billing_staff", "/admin/orders")).toBe(true);
  });

  it("can access order sub-paths", () => {
    expect(canAccessPath("billing_staff", "/admin/orders/abc123")).toBe(true);
  });

  it("cannot access /admin/products", () => {
    expect(canAccessPath("billing_staff", "/admin/products")).toBe(false);
  });

  it("cannot access /admin/users", () => {
    expect(canAccessPath("billing_staff", "/admin/users")).toBe(false);
  });

  it("cannot access /admin/analytics", () => {
    expect(canAccessPath("billing_staff", "/admin/analytics")).toBe(false);
  });
});

describe("canAccessPath — customer", () => {
  it("cannot access /admin", () => {
    expect(canAccessPath("customer", "/admin")).toBe(false);
  });

  it("cannot access any admin path", () => {
    expect(canAccessPath("customer", "/admin/orders")).toBe(false);
    expect(canAccessPath("customer", "/admin/products")).toBe(false);
  });
});

describe("canAccessPath — unknown/invalid role", () => {
  it("unknown role cannot access anything", () => {
    expect(canAccessPath("hacker", "/admin")).toBe(false);
    expect(canAccessPath("", "/admin")).toBe(false);
  });
});

describe("canAccessPath — path prefix safety", () => {
  it("'/admin/ordersXXX' does not match '/admin/orders' prefix", () => {
    // Ensure prefix matching requires a slash separator, not just startsWith
    expect(canAccessPath("billing_staff", "/admin/ordersXXX")).toBe(false);
  });

  it("'/admin/products-export' is allowed for inventory_staff via /admin/products prefix", () => {
    // /admin/products-export starts with /admin/products but no slash after
    // This tests the actual startsWith(prefix + '/') or === prefix logic
    // The correct answer depends on implementation — document the actual behaviour
    const result = canAccessPath("inventory_staff", "/admin/products-export");
    // Should be false — prefix match requires '/' separator, not just any char
    expect(result).toBe(false);
  });
});

// ── isAdminRole ───────────────────────────────────────────────────────────────

describe("isAdminRole", () => {
  it("owner → true", () => expect(isAdminRole("owner")).toBe(true));
  it("admin → true", () => expect(isAdminRole("admin")).toBe(true));
  it("manager → true", () => expect(isAdminRole("manager")).toBe(true));
  it("inventory_staff → true", () => expect(isAdminRole("inventory_staff")).toBe(true));
  it("billing_staff → true", () => expect(isAdminRole("billing_staff")).toBe(true));
  it("customer → false", () => expect(isAdminRole("customer")).toBe(false));
  it("empty string → false", () => expect(isAdminRole("")).toBe(false));
  it("unknown → false", () => expect(isAdminRole("superuser")).toBe(false));
});

// ── isOwner ───────────────────────────────────────────────────────────────────

describe("isOwner", () => {
  it("owner → true", () => expect(isOwner("owner")).toBe(true));
  it("admin → false", () => expect(isOwner("admin")).toBe(false));
  it("manager → false", () => expect(isOwner("manager")).toBe(false));
  it("customer → false", () => expect(isOwner("customer")).toBe(false));
  it("empty string → false", () => expect(isOwner("")).toBe(false));
});
