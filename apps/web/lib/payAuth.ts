import crypto from "crypto";
import type { Session } from "next-auth";

// Guest pre-payment access capability for /checkout/pay/[id].
//
// Deliberately a SEPARATE mechanism from apps/web/lib/orderAccess.ts (the
// guest confirmation grant used post-payment/post-COD-creation) and from
// apps/web/lib/emails/orderExpired.ts's resume token (used only for
// /checkout/resume/[token] after an order has expired). All three sign
// "orderId + expiry" with an HMAC, but each has its own purpose label and
// derived key so a token minted for one purpose can never be replayed
// against another — a resume token cannot be used as a pay capability, and
// a pay capability cannot be used to access the post-payment confirmation
// pages, even though all three ultimately derive from NEXTAUTH_SECRET (no
// dedicated env var exists in this project's conventions for single-purpose
// HMAC secrets; every sibling mechanism here — totp.ts, orderAccess.ts,
// orderExpired.ts — derives from NEXTAUTH_SECRET the same way, always with
// a distinct domain-separating label folded into the key derivation itself,
// not just the signed payload, which is what actually prevents cross-use).
//
// Delivered via a URL query token (?pay_token=...), not a cookie — the pay
// page is reached before any payment confirmation event, so it is a
// materially earlier and less-verified trust moment than either of the
// other two mechanisms; scoping it to yet another cookie would have meant
// widening an origin-wide cookie path a third time (see the COD fix's
// documented path override) rather than keeping this capability narrowly
// bound to exactly the one URL it's issued for.

// Must mirror ABANDONED_AFTER_MINUTES in
// apps/web/app/api/cron/release-stock/route.ts (not exported there, so this
// is kept in sync manually) — a pending online order is released back to
// stock after 30 minutes, so a pay capability outliving that is pointless:
// the order itself becomes inaccessible (status leaves "pending") first.
export const PAY_CAPABILITY_TTL_MS = 30 * 60 * 1000;

const PAY_AUTH_PURPOSE = "payauth:v1";

function getPayAuthKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return crypto.createHash("sha256").update(`${PAY_AUTH_PURPOSE}:${secret}`).digest();
}

function sign(orderId: string, expiresAtMs: number): string {
  return crypto
    .createHmac("sha256", getPayAuthKey())
    .update(`${PAY_AUTH_PURPOSE}:${orderId}:${expiresAtMs}`)
    .digest("hex");
}

/**
 * Mints a pay capability token for a specific order. Base64url-encoded
 * "orderId:expiresAtMs:signature" — replayable (not single-use) for its
 * full 30-minute lifetime, since a legitimate customer may dismiss and
 * re-open the Razorpay modal, or refresh the page, multiple times while
 * completing one payment attempt.
 */
export function buildPayCapabilityToken(orderId: string): string {
  const expiresAtMs = Date.now() + PAY_CAPABILITY_TTL_MS;
  const signature = sign(orderId, expiresAtMs);
  return Buffer.from(`${orderId}:${expiresAtMs}:${signature}`).toString("base64url");
}

/**
 * Verifies a pay capability token against a specific orderId. Rejects
 * missing, malformed, expired, tampered, or wrong-order tokens. Constant-
 * time signature comparison to avoid timing side-channels.
 */
export function verifyPayCapabilityToken(orderId: string, rawToken: string | undefined | null): boolean {
  if (!rawToken) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(rawToken, "base64url").toString("utf-8");
  } catch {
    return false;
  }

  const parts = decoded.split(":");
  if (parts.length !== 3) return false;
  const [tokenOrderId, expiresAtMsStr, signatureHex] = parts;

  // Explicit order-ID check first (fast-fail before any HMAC computation) —
  // the signature below cryptographically re-binds it regardless.
  if (tokenOrderId !== orderId) return false;
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
 * Server-only authorization gate for pre-payment access to a specific order.
 * - Owned orders (userId set): access requires session.user.id === order.userId.
 *   The guest capability token is never consulted for these.
 * - Guest orders (userId null): access requires a valid, matching capability token.
 */
export function canPayOrder(
  order: OrderOwnership,
  session: Session | null,
  token: string | undefined | null,
): boolean {
  if (order.userId) {
    return !!session?.user?.id && session.user.id === order.userId;
  }
  return verifyPayCapabilityToken(order.id, token);
}
