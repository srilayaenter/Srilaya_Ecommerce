import crypto from "crypto";
import type { Session } from "next-auth";

// Guest order-confirmation access grant: a short-lived, order-scoped, signed
// HttpOnly cookie minted only at the moment a guest's payment is verified
// (see apps/web/app/api/payments/razorpay/verify/route.ts). It lets that
// browser view its own just-completed guest order without requiring login,
// without ever putting the order ID's owner-identifying contact details
// (email/phone/address) in a URL.
//
// For logged-in orders (order.userId set), this grant is never consulted —
// access is session-only. See canAccessOrder().

export const GRANT_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const GRANT_PURPOSE = "orderaccess:v1";

function getGrantKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  // Distinct derivation label so this key is never reused for any other
  // HMAC/encryption purpose in the codebase (see apps/web/lib/totp.ts for
  // the sibling pattern keyed off the same NEXTAUTH_SECRET).
  return crypto.createHash("sha256").update(`${GRANT_PURPOSE}:${secret}`).digest();
}

export function orderAccessCookieName(orderId: string): string {
  return `order_access_${orderId}`;
}

function sign(orderId: string, expiresAtMs: number): string {
  return crypto
    .createHmac("sha256", getGrantKey())
    .update(`${GRANT_PURPOSE}:${orderId}:${expiresAtMs}`)
    .digest("hex");
}

/** Builds the {name, value, options} for setting the guest access cookie on a specific order. */
export function buildOrderAccessGrant(orderId: string) {
  const expiresAtMs = Date.now() + GRANT_TTL_MS;
  const signature = sign(orderId, expiresAtMs);
  return {
    name: orderAccessCookieName(orderId),
    value: `${expiresAtMs}.${signature}`,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: `/orders/${orderId}`,
      maxAge: Math.floor(GRANT_TTL_MS / 1000),
    },
  };
}

/**
 * Verifies a raw cookie value against a specific orderId. Rejects missing,
 * malformed, expired, tampered, or wrong-order values. Constant-time
 * signature comparison to avoid timing side-channels.
 */
export function verifyOrderAccessGrant(orderId: string, rawCookieValue: string | undefined): boolean {
  if (!rawCookieValue) return false;

  const parts = rawCookieValue.split(".");
  if (parts.length !== 2) return false;
  const [expiresAtMsStr, signatureHex] = parts;

  if (!/^\d+$/.test(expiresAtMsStr) || !/^[a-f0-9]+$/.test(signatureHex)) return false;

  const expiresAtMs = Number(expiresAtMsStr);
  if (!Number.isFinite(expiresAtMs) || Date.now() >= expiresAtMs) return false;

  const expected = sign(orderId, expiresAtMs);
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(signatureHex, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

type OrderOwnership = { id: string; userId: string | null };

/**
 * Server-only authorization gate for a specific order.
 * - Owned orders (userId set): access requires session.user.id === order.userId. The
 *   guest grant cookie is never consulted for these, even if present.
 * - Guest orders (userId null): access requires a valid, matching grant cookie.
 */
export function canAccessOrder(
  order: OrderOwnership,
  session: Session | null,
  grantCookieValue: string | undefined,
): boolean {
  if (order.userId) {
    return !!session?.user?.id && session.user.id === order.userId;
  }
  return verifyOrderAccessGrant(order.id, grantCookieValue);
}
