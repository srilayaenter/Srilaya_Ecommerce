import { describe, it, expect } from "vitest";
import { requirePathAccess, requireExactRoles } from "../../apps/web/lib/permissions";

// ── requirePathAccess ───────────────────────────────────────────────────────
// A thin wrapper over canAccessPath — these tests prove it behaves identically,
// not re-testing canAccessPath's full logic (already covered in permissions.test.ts).

describe("requirePathAccess", () => {
  it("owner has unrestricted access", () => {
    expect(requirePathAccess("owner", "/admin/anything")).toBe(true);
    expect(requirePathAccess("owner", "/api/admin/anything")).toBe(true);
  });

  it("manager can access a page path it's allowed", () => {
    expect(requirePathAccess("manager", "/admin/orders")).toBe(true);
  });

  it("manager can access the newly-added inventory-import API path", () => {
    expect(requirePathAccess("manager", "/api/admin/inventory/import")).toBe(true);
  });

  it("inventory_staff can access the newly-added inventory-import API path", () => {
    expect(requirePathAccess("inventory_staff", "/api/admin/inventory/import")).toBe(true);
  });

  it("billing_staff cannot access a path outside its allow-list", () => {
    expect(requirePathAccess("billing_staff", "/api/admin/products")).toBe(false);
  });

  it("customer cannot access any admin path", () => {
    expect(requirePathAccess("customer", "/admin")).toBe(false);
  });

  it("unknown role cannot access anything", () => {
    expect(requirePathAccess("hacker", "/admin")).toBe(false);
  });
});

// ── requireExactRoles ───────────────────────────────────────────────────────
// Does NOT consult ROLE_ALLOWED_PATHS — a role is allowed only if literally
// named in allowedRoles. The P&L regression (admin rejected) is the single
// most important case here.

describe("requireExactRoles", () => {
  it("allows a role that is literally in the list", () => {
    expect(requireExactRoles("owner", ["owner"])).toBe(true);
  });

  it("rejects a role not in the list", () => {
    expect(requireExactRoles("manager", ["owner"])).toBe(false);
  });

  it("rejects unauthenticated/empty role", () => {
    expect(requireExactRoles("", ["owner"])).toBe(false);
  });

  it("supports a multi-role list", () => {
    expect(requireExactRoles("admin", ["owner", "admin"])).toBe(true);
    expect(requireExactRoles("manager", ["owner", "admin"])).toBe(false);
  });

  describe("P&L regression — requireExactRoles(role, ['owner'])", () => {
    it("owner allowed", () => {
      expect(requireExactRoles("owner", ["owner"])).toBe(true);
    });

    it("admin REJECTED — despite admin's unrestricted middleware access via the '/admin' wildcard, requireExactRoles does not consult that model at all", () => {
      expect(requireExactRoles("admin", ["owner"])).toBe(false);
    });

    it("manager rejected", () => {
      expect(requireExactRoles("manager", ["owner"])).toBe(false);
    });

    it("inventory_staff rejected", () => {
      expect(requireExactRoles("inventory_staff", ["owner"])).toBe(false);
    });

    it("billing_staff rejected", () => {
      expect(requireExactRoles("billing_staff", ["owner"])).toBe(false);
    });

    it("customer rejected", () => {
      expect(requireExactRoles("customer", ["owner"])).toBe(false);
    });

    it("unauthenticated (empty role) rejected", () => {
      expect(requireExactRoles("", ["owner"])).toBe(false);
    });
  });
});
