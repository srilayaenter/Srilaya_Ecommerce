import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Same expiry as the existing password-reset flow (apps/web/app/api/auth/forgot-password/route.ts)
// for consistency across the codebase's token-based auth flows.
export const ACTIVATION_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export type RedeemFailureReason =
  | "not_found"
  | "expired"
  | "already_used"
  | "malformed"
  | "account_deactivated";

export type RedeemResult =
  | { ok: true; userId: string }
  | { ok: false; reason: RedeemFailureReason };

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Builds the activation link from the trusted, server-configured app URL —
 * never from a client-supplied Host header. Enforces HTTPS outside local
 * development to avoid leaking a raw activation token over an unencrypted
 * connection.
 */
export function buildActivationUrl(rawToken: string): string {
  const configured = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const isLocal = configured.includes("localhost") || configured.includes("127.0.0.1");
  const baseUrl = !isLocal && configured.startsWith("http://")
    ? configured.replace(/^http:\/\//, "https://")
    : configured;
  return `${baseUrl}/admin/activate?token=${rawToken}`;
}

/**
 * Issues a new activation token for a staff user, invalidating any
 * previously issued unredeemed tokens for that user first (so only the
 * newest link is ever valid).
 * Returns the raw token — callers must place it in the activation link and
 * never persist or log it. Only its SHA-256 hash is stored.
 */
export async function issueActivationToken(userId: string): Promise<string> {
  await prisma.staffActivationToken.deleteMany({ where: { userId } });

  const rawToken = crypto.randomBytes(32).toString("hex"); // 256 bits of entropy
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS);

  await prisma.staffActivationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

/**
 * Redeems an activation token: sets the account's password, atomically and
 * exactly once. Concurrency-safe under Postgres READ COMMITTED — the
 * delete inside the transaction is the single-use gate, so only one of two
 * truly concurrent callers can ever succeed. The losing caller's exact
 * failure reason depends on interleaving: it sees "already_used" if it
 * queries the token row before the winner's delete commits (then loses the
 * row-locked delete), or "not_found" if it queries after the winner has
 * already committed — both are safe, equally rejected outcomes; the API
 * layer maps every failure reason to the same generic error either way.
 * Rejects (and revokes the token) if the account was deactivated after the
 * invite was issued, rather than silently reactivating it.
 */
export async function redeemActivationToken(
  rawToken: string,
  newPassword: string,
): Promise<RedeemResult> {
  const tokenHash = hashToken(rawToken);
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  return prisma.$transaction(async (tx) => {
    const record = await tx.staffActivationToken.findUnique({ where: { tokenHash } });
    if (!record) return { ok: false, reason: "not_found" as const };

    if (record.expiresAt < new Date()) {
      await tx.staffActivationToken.deleteMany({ where: { tokenHash } });
      return { ok: false, reason: "expired" as const };
    }

    // Accounts start active:true when invited (see issueActivationToken
    // callers). If the account is active:false at redemption time, an
    // admin must have explicitly deactivated it after the invite was sent
    // — treat that as a revoked invitation rather than silently
    // reactivating the account.
    const user = await tx.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.active) {
      await tx.staffActivationToken.deleteMany({ where: { tokenHash } });
      return { ok: false, reason: "account_deactivated" as const };
    }

    const claim = await tx.staffActivationToken.deleteMany({ where: { tokenHash } });
    if (claim.count === 0) {
      // Another concurrent request already consumed this token.
      return { ok: false, reason: "already_used" as const };
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    });

    return { ok: true, userId: record.userId };
  });
}
