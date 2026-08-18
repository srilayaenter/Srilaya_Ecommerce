import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}));

import {
  isOwnerOrAdminRole,
  isValidStaffRole,
  applyToggleUserActive,
  applyUpdateUserRole,
  applyResetPassword,
  applyCreateStaffUser,
  ALLOWED_STAFF_ROLES,
} from "../../apps/web/lib/userAdminActions";
import { prisma } from "../../apps/web/lib/db";
import bcrypt from "bcryptjs";

const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockUpdate = vi.mocked(prisma.user.update);
const mockCreate = vi.mocked(prisma.user.create);

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue({} as any);
  mockCreate.mockResolvedValue({} as any);
  mockFindUnique.mockResolvedValue(null);
});

// ── Pure predicates ────────────────────────────────────────────────────────

describe("isOwnerOrAdminRole", () => {
  it("returns true for owner and admin", () => {
    expect(isOwnerOrAdminRole("owner")).toBe(true);
    expect(isOwnerOrAdminRole("admin")).toBe(true);
  });

  it("returns false for every other role, including null/undefined", () => {
    for (const role of ["manager", "inventory_staff", "billing_staff", "customer", "", null, undefined]) {
      expect(isOwnerOrAdminRole(role as any)).toBe(false);
    }
  });
});

describe("isValidStaffRole", () => {
  it("accepts every value in ALLOWED_STAFF_ROLES", () => {
    for (const role of ALLOWED_STAFF_ROLES) {
      expect(isValidStaffRole(role)).toBe(true);
    }
  });

  it("rejects unknown strings, owner, and non-strings", () => {
    expect(isValidStaffRole("owner")).toBe(false);
    expect(isValidStaffRole("superuser")).toBe(false);
    expect(isValidStaffRole("")).toBe(false);
    expect(isValidStaffRole(null)).toBe(false);
    expect(isValidStaffRole(undefined)).toBe(false);
    expect(isValidStaffRole(42)).toBe(false);
  });
});

// ── applyToggleUserActive ─────────────────────────────────────────────────

describe("applyToggleUserActive — authorization", () => {
  it.each(["owner", "admin"])("allows role %s", async (role) => {
    const result = await applyToggleUserActive({ actorRole: role, userId: "user-1", active: false });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it.each(["manager", "inventory_staff", "billing_staff", "customer", "", null, undefined])(
    "rejects role %s and performs no write",
    async (role) => {
      const result = await applyToggleUserActive({ actorRole: role as any, userId: "user-1", active: false });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("rejected_unauthorised");
      expect(mockUpdate).not.toHaveBeenCalled();
    },
  );
});

describe("applyToggleUserActive — input validation", () => {
  it("rejects a missing/empty userId even for an authorized actor", async () => {
    const result = await applyToggleUserActive({ actorRole: "admin", userId: "", active: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("applyToggleUserActive — targets only the specified user", () => {
  it("writes exactly one update, scoped to the given userId, with only the active field", async () => {
    await applyToggleUserActive({ actorRole: "owner", userId: "user-target", active: false });
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-target" },
      data: { active: false },
    });
  });

  it("toggling one user does not touch any other user's record (no where clause matching another id)", async () => {
    await applyToggleUserActive({ actorRole: "owner", userId: "user-A", active: true });
    const [{ where }] = mockUpdate.mock.calls[0];
    expect(where).toEqual({ id: "user-A" });
    expect(where).not.toEqual({ id: "user-B" });
  });

  it("can set active true or false depending on the requested value", async () => {
    await applyToggleUserActive({ actorRole: "admin", userId: "user-1", active: true });
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { active: true } });

    await applyToggleUserActive({ actorRole: "admin", userId: "user-1", active: false });
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { active: false } });
  });
});

// ── applyUpdateUserRole ────────────────────────────────────────────────────

describe("applyUpdateUserRole", () => {
  it("allows owner/admin with a valid role", async () => {
    const result = await applyUpdateUserRole({ actorRole: "admin", userId: "user-1", role: "manager" });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { role: "manager" } });
  });

  it("rejects an unauthorized actor without writing", async () => {
    const result = await applyUpdateUserRole({ actorRole: "manager", userId: "user-1", role: "billing_staff" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_unauthorised");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid role even for an authorized actor", async () => {
    const result = await applyUpdateUserRole({ actorRole: "owner", userId: "user-1", role: "superuser" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects a missing userId", async () => {
    const result = await applyUpdateUserRole({ actorRole: "owner", userId: "", role: "manager" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
  });
});

// ── applyResetPassword ─────────────────────────────────────────────────────

describe("applyResetPassword", () => {
  it("allows owner/admin with a valid password, hashes it before writing", async () => {
    const result = await applyResetPassword({ actorRole: "owner", userId: "user-1", newPassword: "longenough123" });
    expect(result.ok).toBe(true);
    expect(bcrypt.hash).toHaveBeenCalledWith("longenough123", 10);
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { password: "hashed-password" } });
  });

  it("rejects an unauthorized actor without hashing or writing", async () => {
    const result = await applyResetPassword({ actorRole: "billing_staff", userId: "user-1", newPassword: "longenough123" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_unauthorised");
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects a too-short password for an authorized actor", async () => {
    const result = await applyResetPassword({ actorRole: "admin", userId: "user-1", newPassword: "short" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects a missing password", async () => {
    const result = await applyResetPassword({ actorRole: "admin", userId: "user-1", newPassword: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
  });

  it("rejects a missing userId", async () => {
    const result = await applyResetPassword({ actorRole: "admin", userId: "", newPassword: "longenough123" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
  });
});

// ── applyCreateStaffUser ────────────────────────────────────────────────────

describe("applyCreateStaffUser", () => {
  it("allows owner/admin, creates a new user when none exists, normalizes email casing", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await applyCreateStaffUser({
      actorRole: "owner",
      email: "  Staff@Example.com  ",
      password: "longenough123",
      role: "manager",
    });
    expect(result.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { email: "staff@example.com", password: "hashed-password", role: "manager" },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates (not creates) when the email already exists", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing-user" } as any);
    const result = await applyCreateStaffUser({
      actorRole: "admin",
      email: "existing@example.com",
      password: "longenough123",
      role: "billing_staff",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { email: "existing@example.com" },
      data: { role: "billing_staff", password: "hashed-password" },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects an unauthorized actor without touching the database", async () => {
    const result = await applyCreateStaffUser({
      actorRole: "inventory_staff",
      email: "new@example.com",
      password: "longenough123",
      role: "manager",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_unauthorised");
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid role for an authorized actor", async () => {
    const result = await applyCreateStaffUser({
      actorRole: "owner",
      email: "new@example.com",
      password: "longenough123",
      role: "owner",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rejected_invalid_input");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing email or password", async () => {
    const noEmail = await applyCreateStaffUser({ actorRole: "owner", email: "", password: "longenough123", role: "manager" });
    expect(noEmail.ok).toBe(false);

    const noPassword = await applyCreateStaffUser({ actorRole: "owner", email: "a@b.com", password: "", role: "manager" });
    expect(noPassword.ok).toBe(false);
  });
});

// ── Regression guard: every action rejects before any DB call when unauthorized ─

describe("regression — unauthorized actor never reaches the database", () => {
  it("none of the four actions call prisma when actorRole is unauthorized", async () => {
    await applyToggleUserActive({ actorRole: "customer", userId: "u1", active: true });
    await applyUpdateUserRole({ actorRole: "customer", userId: "u1", role: "manager" });
    await applyResetPassword({ actorRole: "customer", userId: "u1", newPassword: "longenough123" });
    await applyCreateStaffUser({ actorRole: "customer", email: "a@b.com", password: "longenough123", role: "manager" });

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
