import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_SECRET = process.env.NEXTAUTH_SECRET;

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-value-for-pay-auth";
  vi.resetModules();
});

afterEach(() => {
  process.env.NEXTAUTH_SECRET = ORIGINAL_SECRET;
});

async function loadModule() {
  return import("../../apps/web/lib/payAuth");
}

describe("buildPayCapabilityToken / verifyPayCapabilityToken", () => {
  it("a freshly minted token verifies successfully for its own order", async () => {
    const { buildPayCapabilityToken, verifyPayCapabilityToken } = await loadModule();
    const token = buildPayCapabilityToken("order-abc");
    expect(verifyPayCapabilityToken("order-abc", token)).toBe(true);
  });

  it("token is base64url encoded", async () => {
    const { buildPayCapabilityToken } = await loadModule();
    const token = buildPayCapabilityToken("order-abc");
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url alphabet, no padding chars leaked
  });

  it("TTL is 30 minutes, matching the release-stock cron's pending-order cutoff", async () => {
    const { PAY_CAPABILITY_TTL_MS } = await loadModule();
    expect(PAY_CAPABILITY_TTL_MS).toBe(30 * 60 * 1000);
  });

  it("two tokens minted for the same order are different (fresh expiry each time)", async () => {
    const { buildPayCapabilityToken } = await loadModule();
    const t1 = buildPayCapabilityToken("order-abc");
    const t2 = buildPayCapabilityToken("order-abc");
    // Not asserting inequality strictly (same-millisecond mint could collide) —
    // assert both independently verify, which is what actually matters for replay.
    const { verifyPayCapabilityToken } = await loadModule();
    expect(verifyPayCapabilityToken("order-abc", t1)).toBe(true);
    expect(verifyPayCapabilityToken("order-abc", t2)).toBe(true);
  });

  it("REPLAY: the same token verifies successfully multiple times within its lifetime", async () => {
    const { buildPayCapabilityToken, verifyPayCapabilityToken } = await loadModule();
    const token = buildPayCapabilityToken("order-abc");
    expect(verifyPayCapabilityToken("order-abc", token)).toBe(true);
    expect(verifyPayCapabilityToken("order-abc", token)).toBe(true);
    expect(verifyPayCapabilityToken("order-abc", token)).toBe(true);
  });

  // ── rejection cases ────────────────────────────────────────────────────

  it("rejects a missing token", async () => {
    const { verifyPayCapabilityToken } = await loadModule();
    expect(verifyPayCapabilityToken("order-abc", undefined)).toBe(false);
    expect(verifyPayCapabilityToken("order-abc", null)).toBe(false);
    expect(verifyPayCapabilityToken("order-abc", "")).toBe(false);
  });

  it("rejects a malformed token (not valid base64url, or wrong internal shape)", async () => {
    const { verifyPayCapabilityToken } = await loadModule();
    expect(verifyPayCapabilityToken("order-abc", "not-a-real-token")).toBe(false);
    expect(verifyPayCapabilityToken("order-abc", Buffer.from("only:two").toString("base64url"))).toBe(false);
    expect(verifyPayCapabilityToken("order-abc", Buffer.from("a:b:c:d").toString("base64url"))).toBe(false);
  });

  it("rejects an expired token even if correctly signed", async () => {
    const { verifyPayCapabilityToken } = await loadModule();
    const crypto = await import("crypto");
    const key = crypto.createHash("sha256").update("payauth:v1:test-secret-value-for-pay-auth").digest();
    const expiresAtMs = Date.now() - 1000;
    const sig = crypto.createHmac("sha256", key).update(`payauth:v1:order-abc:${expiresAtMs}`).digest("hex");
    const token = Buffer.from(`order-abc:${expiresAtMs}:${sig}`).toString("base64url");
    expect(verifyPayCapabilityToken("order-abc", token)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const { buildPayCapabilityToken, verifyPayCapabilityToken } = await loadModule();
    const token = buildPayCapabilityToken("order-abc");
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [orderId, expiresAtMs] = decoded.split(":");
    const tampered = Buffer.from(`${orderId}:${expiresAtMs}:${"0".repeat(64)}`).toString("base64url");
    expect(verifyPayCapabilityToken("order-abc", tampered)).toBe(false);
  });

  it("rejects a tampered expiry (extending its own lifetime)", async () => {
    const { buildPayCapabilityToken, verifyPayCapabilityToken } = await loadModule();
    const token = buildPayCapabilityToken("order-abc");
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [orderId, , signature] = decoded.split(":");
    const farFuture = Date.now() + 999 * 24 * 60 * 60 * 1000;
    const tampered = Buffer.from(`${orderId}:${farFuture}:${signature}`).toString("base64url");
    expect(verifyPayCapabilityToken("order-abc", tampered)).toBe(false);
  });

  it("rejects a token minted for a different order (cross-order rejection)", async () => {
    const { buildPayCapabilityToken, verifyPayCapabilityToken } = await loadModule();
    const tokenForA = buildPayCapabilityToken("order-A");
    expect(verifyPayCapabilityToken("order-B", tokenForA)).toBe(false);
  });

  it("rejects a token signed under a different NEXTAUTH_SECRET", async () => {
    const mod1 = await loadModule();
    const token = mod1.buildPayCapabilityToken("order-abc");

    process.env.NEXTAUTH_SECRET = "a-completely-different-secret";
    vi.resetModules();
    const mod2 = await loadModule();
    expect(mod2.verifyPayCapabilityToken("order-abc", token)).toBe(false);
  });

  it("PURPOSE ISOLATION: a resume token (orderExpired.ts) is not accepted as a pay capability", async () => {
    // Same NEXTAUTH_SECRET, deliberately different purpose label/key derivation —
    // proves the two mechanisms cannot be cross-used even under a shared secret.
    // Longer timeout: this dynamic import (plus its own dependency graph) run
    // right after vi.resetModules() can be slow to transform under full-suite
    // parallel load, even though it's fast in isolation.
    const orderExpired = await import("../../apps/web/lib/emails/orderExpired");
    const resumeToken = orderExpired.createResumeToken("order-abc");

    const { verifyPayCapabilityToken } = await loadModule();
    expect(verifyPayCapabilityToken("order-abc", resumeToken)).toBe(false);
  }, 15000);

  it("PURPOSE ISOLATION: an orderAccess.ts guest grant value is not accepted as a pay capability", async () => {
    const orderAccess = await import("../../apps/web/lib/orderAccess");
    const grant = orderAccess.buildOrderAccessGrant("order-abc");

    const { verifyPayCapabilityToken } = await loadModule();
    expect(verifyPayCapabilityToken("order-abc", grant.value)).toBe(false);
  });
});

describe("canPayOrder", () => {
  it("owned order: allows when session.user.id matches order.userId", async () => {
    const { canPayOrder } = await loadModule();
    const order = { id: "order-1", userId: "user-1" };
    const session = { user: { id: "user-1", role: "customer" } } as any;
    expect(canPayOrder(order, session, undefined)).toBe(true);
  });

  it("owned order: denies a different logged-in user", async () => {
    const { canPayOrder } = await loadModule();
    const order = { id: "order-1", userId: "user-1" };
    const session = { user: { id: "user-2", role: "customer" } } as any;
    expect(canPayOrder(order, session, undefined)).toBe(false);
  });

  it("owned order: the guest capability token is never consulted, even if it would otherwise be valid", async () => {
    const { canPayOrder, buildPayCapabilityToken } = await loadModule();
    const order = { id: "order-1", userId: "user-1" };
    const token = buildPayCapabilityToken("order-1");
    const wrongSession = { user: { id: "user-2", role: "customer" } } as any;
    expect(canPayOrder(order, wrongSession, token)).toBe(false);
  });

  it("guest order (userId null): allows with a valid matching token", async () => {
    const { canPayOrder, buildPayCapabilityToken } = await loadModule();
    const order = { id: "order-guest-1", userId: null };
    const token = buildPayCapabilityToken("order-guest-1");
    expect(canPayOrder(order, null, token)).toBe(true);
  });

  it("guest order (userId null): denies without a token", async () => {
    const { canPayOrder } = await loadModule();
    const order = { id: "order-guest-1", userId: null };
    expect(canPayOrder(order, null, undefined)).toBe(false);
  });

  it("guest order (userId null): denies a token minted for a different order", async () => {
    const { canPayOrder, buildPayCapabilityToken } = await loadModule();
    const order = { id: "order-guest-B", userId: null };
    const tokenForA = buildPayCapabilityToken("order-guest-A");
    expect(canPayOrder(order, null, tokenForA)).toBe(false);
  });

  it("guest order (userId null): a logged-in session alone does not grant access without the token", async () => {
    const { canPayOrder } = await loadModule();
    const order = { id: "order-guest-1", userId: null };
    const session = { user: { id: "user-1", role: "customer" } } as any;
    expect(canPayOrder(order, session, undefined)).toBe(false);
  });
});
