import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_SECRET = process.env.NEXTAUTH_SECRET;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-value-for-order-access";
  vi.resetModules();
});

afterEach(() => {
  process.env.NEXTAUTH_SECRET = ORIGINAL_SECRET;
  (process.env as any).NODE_ENV = ORIGINAL_NODE_ENV;
});

async function loadModule() {
  return import("../../apps/web/lib/orderAccess");
}

describe("buildOrderAccessGrant / verifyOrderAccessGrant", () => {
  it("a freshly minted grant verifies successfully for its own order", async () => {
    const { buildOrderAccessGrant, verifyOrderAccessGrant } = await loadModule();
    const grant = buildOrderAccessGrant("order-abc");
    expect(verifyOrderAccessGrant("order-abc", grant.value)).toBe(true);
  });

  it("cookie name is order-scoped (order_access_<orderId>)", async () => {
    const { orderAccessCookieName } = await loadModule();
    expect(orderAccessCookieName("order-abc")).toBe("order_access_order-abc");
  });

  it("cookie options: httpOnly, sameSite=lax, narrow path, explicit maxAge", async () => {
    const { buildOrderAccessGrant, GRANT_TTL_MS } = await loadModule();
    const grant = buildOrderAccessGrant("order-abc");
    expect(grant.options.httpOnly).toBe(true);
    expect(grant.options.sameSite).toBe("lax");
    expect(grant.options.path).toBe("/orders/order-abc");
    expect(grant.options.maxAge).toBe(Math.floor(GRANT_TTL_MS / 1000));
  });

  it("secure is true in production, false otherwise", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();
    const prod = await loadModule();
    expect(prod.buildOrderAccessGrant("order-abc").options.secure).toBe(true);

    process.env.NODE_ENV = "development";
    vi.resetModules();
    const dev = await loadModule();
    expect(dev.buildOrderAccessGrant("order-abc").options.secure).toBe(false);
  });

  // ── rejection cases ────────────────────────────────────────────────────

  it("rejects a missing cookie value", async () => {
    const { verifyOrderAccessGrant } = await loadModule();
    expect(verifyOrderAccessGrant("order-abc", undefined)).toBe(false);
  });

  it("rejects a malformed cookie value (wrong shape)", async () => {
    const { verifyOrderAccessGrant } = await loadModule();
    expect(verifyOrderAccessGrant("order-abc", "not-a-valid-grant")).toBe(false);
    expect(verifyOrderAccessGrant("order-abc", "123.456.789")).toBe(false);
    expect(verifyOrderAccessGrant("order-abc", "abc.deadbeef")).toBe(false); // non-numeric expiry
    expect(verifyOrderAccessGrant("order-abc", "123.not-hex!!")).toBe(false); // non-hex signature
  });

  it("rejects an expired grant", async () => {
    const { verifyOrderAccessGrant } = await loadModule();
    // Craft a value with a timestamp in the past but otherwise well-formed —
    // even a *correctly signed* past-expiry value must be rejected.
    const crypto = await import("crypto");
    const key = crypto.createHash("sha256").update("orderaccess:v1:test-secret-value-for-order-access").digest();
    const expiresAtMs = Date.now() - 1000;
    const sig = crypto.createHmac("sha256", key).update(`orderaccess:v1:order-abc:${expiresAtMs}`).digest("hex");
    expect(verifyOrderAccessGrant("order-abc", `${expiresAtMs}.${sig}`)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const { buildOrderAccessGrant, verifyOrderAccessGrant } = await loadModule();
    const grant = buildOrderAccessGrant("order-abc");
    const [expiresAtMs] = grant.value.split(".");
    const tampered = `${expiresAtMs}.${"0".repeat(64)}`;
    expect(verifyOrderAccessGrant("order-abc", tampered)).toBe(false);
  });

  it("rejects a grant for a different order ID (order-ID binding)", async () => {
    const { buildOrderAccessGrant, verifyOrderAccessGrant } = await loadModule();
    const grantForA = buildOrderAccessGrant("order-A");
    expect(verifyOrderAccessGrant("order-B", grantForA.value)).toBe(false);
  });

  it("rejects a value with a tampered expiry (extending its own lifetime)", async () => {
    const { buildOrderAccessGrant, verifyOrderAccessGrant } = await loadModule();
    const grant = buildOrderAccessGrant("order-abc");
    const [, signature] = grant.value.split(".");
    const farFuture = Date.now() + 999 * 24 * 60 * 60 * 1000;
    const tamperedExpiry = `${farFuture}.${signature}`;
    // Signature no longer matches the (attacker-modified) expiry — must fail.
    expect(verifyOrderAccessGrant("order-abc", tamperedExpiry)).toBe(false);
  });

  it("a grant signed under a different NEXTAUTH_SECRET is rejected (wrong-purpose/key simulation)", async () => {
    const mod1 = await loadModule();
    const grant = mod1.buildOrderAccessGrant("order-abc");

    process.env.NEXTAUTH_SECRET = "a-completely-different-secret";
    vi.resetModules();
    const mod2 = await loadModule();
    expect(mod2.verifyOrderAccessGrant("order-abc", grant.value)).toBe(false);
  });
});

describe("canAccessOrder", () => {
  it("owned order: allows when session.user.id matches order.userId", async () => {
    const { canAccessOrder } = await loadModule();
    const order = { id: "order-1", userId: "user-1" };
    const session = { user: { id: "user-1", role: "customer" } } as any;
    expect(canAccessOrder(order, session, undefined)).toBe(true);
  });

  it("owned order: denies a different logged-in user", async () => {
    const { canAccessOrder } = await loadModule();
    const order = { id: "order-1", userId: "user-1" };
    const session = { user: { id: "user-2", role: "customer" } } as any;
    expect(canAccessOrder(order, session, undefined)).toBe(false);
  });

  it("owned order: denies an anonymous (no session) caller, even with some cookie present", async () => {
    const { canAccessOrder, buildOrderAccessGrant } = await loadModule();
    const order = { id: "order-1", userId: "user-1" };
    const grant = buildOrderAccessGrant("order-1"); // attacker somehow has a grant cookie
    expect(canAccessOrder(order, null, grant.value)).toBe(false);
  });

  it("owned order: the guest grant cookie is never consulted, even if it would otherwise be valid", async () => {
    const { canAccessOrder, buildOrderAccessGrant } = await loadModule();
    const order = { id: "order-1", userId: "user-1" };
    // A valid grant for this exact order — should still be ignored because the order is owned.
    const grant = buildOrderAccessGrant("order-1");
    const wrongSession = { user: { id: "user-2", role: "customer" } } as any;
    expect(canAccessOrder(order, wrongSession, grant.value)).toBe(false);
  });

  it("guest order (userId null): allows with a valid matching grant", async () => {
    const { canAccessOrder, buildOrderAccessGrant } = await loadModule();
    const order = { id: "order-guest-1", userId: null };
    const grant = buildOrderAccessGrant("order-guest-1");
    expect(canAccessOrder(order, null, grant.value)).toBe(true);
  });

  it("guest order (userId null): denies without a grant", async () => {
    const { canAccessOrder } = await loadModule();
    const order = { id: "order-guest-1", userId: null };
    expect(canAccessOrder(order, null, undefined)).toBe(false);
  });

  it("guest order (userId null): denies a grant minted for a different order", async () => {
    const { canAccessOrder, buildOrderAccessGrant } = await loadModule();
    const order = { id: "order-guest-B", userId: null };
    const grantForA = buildOrderAccessGrant("order-guest-A");
    expect(canAccessOrder(order, null, grantForA.value)).toBe(false);
  });

  it("guest order (userId null): a logged-in session alone does not grant access without the cookie", async () => {
    const { canAccessOrder } = await loadModule();
    const order = { id: "order-guest-1", userId: null };
    const session = { user: { id: "user-1", role: "customer" } } as any;
    expect(canAccessOrder(order, session, undefined)).toBe(false);
  });
});
