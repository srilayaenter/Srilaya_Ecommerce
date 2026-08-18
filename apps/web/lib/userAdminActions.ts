import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Roles a staff account may be assigned. Single source of truth for the
// server-side validation below — the Users page UI imports this same list.
export const ALLOWED_STAFF_ROLES = [
  "customer",
  "admin",
  "manager",
  "inventory_staff",
  "billing_staff",
] as const;
export type AllowedStaffRole = (typeof ALLOWED_STAFF_ROLES)[number];

export function isValidStaffRole(value: unknown): value is AllowedStaffRole {
  return (
    typeof value === "string" &&
    (ALLOWED_STAFF_ROLES as readonly string[]).includes(value)
  );
}

// Only owner/admin may manage staff accounts. The Users page route is also
// gated by middleware (only owner/admin can reach /admin/users at all), but
// this is re-checked here for defense in depth — UI/route access is not
// sufficient authority, matching the convention already established for
// applyFulfillmentStatusChange.ts and applyAddShipment.ts elsewhere in this
// codebase.
export function isOwnerOrAdminRole(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export type UserAdminActionOutcome =
  | { ok: true }
  | { ok: false; reason: "rejected_unauthorised" | "rejected_invalid_input" };

export async function applyToggleUserActive({
  actorRole,
  userId,
  active,
}: {
  actorRole: string | null | undefined;
  userId: string;
  active: boolean;
}): Promise<UserAdminActionOutcome> {
  if (!isOwnerOrAdminRole(actorRole)) {
    return { ok: false, reason: "rejected_unauthorised" };
  }
  if (!userId) {
    return { ok: false, reason: "rejected_invalid_input" };
  }
  await prisma.user.update({ where: { id: userId }, data: { active } });
  return { ok: true };
}

export async function applyUpdateUserRole({
  actorRole,
  userId,
  role,
}: {
  actorRole: string | null | undefined;
  userId: string;
  role: string;
}): Promise<UserAdminActionOutcome> {
  if (!isOwnerOrAdminRole(actorRole)) {
    return { ok: false, reason: "rejected_unauthorised" };
  }
  if (!userId || !isValidStaffRole(role)) {
    return { ok: false, reason: "rejected_invalid_input" };
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  return { ok: true };
}

export async function applyResetPassword({
  actorRole,
  userId,
  newPassword,
}: {
  actorRole: string | null | undefined;
  userId: string;
  newPassword: string;
}): Promise<UserAdminActionOutcome> {
  if (!isOwnerOrAdminRole(actorRole)) {
    return { ok: false, reason: "rejected_unauthorised" };
  }
  if (!userId || !newPassword || newPassword.length < 8) {
    return { ok: false, reason: "rejected_invalid_input" };
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hash } });
  return { ok: true };
}

export async function applyCreateStaffUser({
  actorRole,
  email,
  password,
  role,
}: {
  actorRole: string | null | undefined;
  email: string;
  password: string;
  role: string;
}): Promise<UserAdminActionOutcome> {
  if (!isOwnerOrAdminRole(actorRole)) {
    return { ok: false, reason: "rejected_unauthorised" };
  }
  if (!email || !password || !isValidStaffRole(role)) {
    return { ok: false, reason: "rejected_invalid_input" };
  }
  const normalizedEmail = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { role, password: hash },
    });
  } else {
    await prisma.user.create({
      data: { email: normalizedEmail, password: hash, role },
    });
  }
  return { ok: true };
}
