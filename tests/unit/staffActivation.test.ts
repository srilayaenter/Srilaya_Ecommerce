import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const findUnique = vi.fn();
const deleteMany = vi.fn();
const create = vi.fn();
const userUpdate = vi.fn();
const userFindUnique = vi.fn();

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    staffActivationToken: {
      findUnique: (...args: any[]) => findUnique(...args),
      deleteMany: (...args: any[]) => deleteMany(...args),
      create: (...args: any[]) => create(...args),
    },
    user: {
      update: (...args: any[]) => userUpdate(...args),
    },
    $transaction: async (fn: any) =>
      fn({
        staffActivationToken: {
          findUnique: (...args: any[]) => findUnique(...args),
          deleteMany: (...args: any[]) => deleteMany(...args),
        },
        user: {
          findUnique: (...args: any[]) => userFindUnique(...args),
          update: (...args: any[]) => userUpdate(...args),
        },
      }),
  },
}));

import {
  issueActivationToken,
  redeemActivationToken,
  buildActivationUrl,
  ACTIVATION_TOKEN_TTL_MS,
} from "../../apps/web/lib/staffActivation";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Expiry constant ─────────────────────────────────────────────────────────

describe("ACTIVATION_TOKEN_TTL_MS", () => {
  it("matches the existing password-reset expiry (1 hour) for consistency", () => {
    expect(ACTIVATION_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });
});

// ── Token randomness / hash storage ─────────────────────────────────────────

describe("issueActivationToken", () => {
  it("generates a token with at least 256 bits of entropy (32-byte hex = 64 chars)", async () => {
    create.mockResolvedValue({});
    deleteMany.mockResolvedValue({ count: 0 });

    const token = await issueActivationToken("user-1");
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("stores only the SHA-256 hash of the token, never the raw token", async () => {
    create.mockResolvedValue({});
    deleteMany.mockResolvedValue({ count: 0 });

    const token = await issueActivationToken("user-1");
    const expectedHash = crypto.createHash("sha256").update(token).digest("hex");

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1", tokenHash: expectedHash }),
    });
    const createArg = create.mock.calls[0][0];
    expect(createArg.data.tokenHash).not.toBe(token);
    expect(JSON.stringify(createArg)).not.toContain(token);
  });

  it("sets an expiry ACTIVATION_TOKEN_TTL_MS in the future", async () => {
    create.mockResolvedValue({});
    deleteMany.mockResolvedValue({ count: 0 });

    const before = Date.now();
    await issueActivationToken("user-1");
    const after = Date.now();

    const createArg = create.mock.calls[0][0];
    const expiresAt: Date = createArg.data.expiresAt;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + ACTIVATION_TOKEN_TTL_MS);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + ACTIVATION_TOKEN_TTL_MS);
  });

  it("invalidates previous unredeemed tokens for the user before issuing a new one", async () => {
    create.mockResolvedValue({});
    deleteMany.mockResolvedValue({ count: 1 });

    await issueActivationToken("user-1");

    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    // deleteMany (invalidate old) must happen before create (issue new)
    const deleteOrder = deleteMany.mock.invocationCallOrder[0];
    const createOrder = create.mock.invocationCallOrder[0];
    expect(deleteOrder).toBeLessThan(createOrder);
  });

  it("two calls in a row produce different tokens (no reuse)", async () => {
    create.mockResolvedValue({});
    deleteMany.mockResolvedValue({ count: 0 });

    const t1 = await issueActivationToken("user-1");
    const t2 = await issueActivationToken("user-1");
    expect(t1).not.toBe(t2);
  });
});

// ── buildActivationUrl ──────────────────────────────────────────────────────

describe("buildActivationUrl", () => {
  const originalEnv = process.env.NEXTAUTH_URL;

  it("uses the configured NEXTAUTH_URL, never a client-supplied host", () => {
    process.env.NEXTAUTH_URL = "https://staging.example.com";
    const url = buildActivationUrl("abc123");
    expect(url).toBe("https://staging.example.com/admin/activate?token=abc123");
    process.env.NEXTAUTH_URL = originalEnv;
  });

  it("allows http for localhost (local development)", () => {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    const url = buildActivationUrl("abc123");
    expect(url).toBe("http://localhost:3000/admin/activate?token=abc123");
    process.env.NEXTAUTH_URL = originalEnv;
  });

  it("upgrades a non-local http URL to https", () => {
    process.env.NEXTAUTH_URL = "http://staging.example.com";
    const url = buildActivationUrl("abc123");
    expect(url).toBe("https://staging.example.com/admin/activate?token=abc123");
    process.env.NEXTAUTH_URL = originalEnv;
  });
});

// ── redeemActivationToken ────────────────────────────────────────────────────

describe("redeemActivationToken", () => {
  it("rejects a token that doesn't exist (not_found)", async () => {
    findUnique.mockResolvedValue(null);

    const result = await redeemActivationToken("nonexistent-token", "NewPassw0rd!");
    expect(result).toEqual({ ok: false, reason: "not_found" });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects and deletes an expired token", async () => {
    findUnique.mockResolvedValue({
      userId: "user-1",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() - 1000),
    });
    deleteMany.mockResolvedValue({ count: 1 });

    const result = await redeemActivationToken("expired-token", "NewPassw0rd!");
    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(deleteMany).toHaveBeenCalledWith({ where: { tokenHash: expect.any(String) } });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("binds redemption to the token's stored userId — updates that user only", async () => {
    findUnique.mockResolvedValue({
      userId: "the-correct-user",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
    });
    userFindUnique.mockResolvedValue({ id: "the-correct-user", active: true });
    deleteMany.mockResolvedValue({ count: 1 });
    userUpdate.mockResolvedValue({});

    const result = await redeemActivationToken("valid-token", "NewPassw0rd!");
    expect(result).toEqual({ ok: true, userId: "the-correct-user" });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "the-correct-user" },
      data: expect.objectContaining({ password: expect.any(String) }),
    });
  });

  it("rejects and deletes the token for a deactivated account, without reactivating it", async () => {
    findUnique.mockResolvedValue({
      userId: "deactivated-user",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
    });
    userFindUnique.mockResolvedValue({ id: "deactivated-user", active: false });
    deleteMany.mockResolvedValue({ count: 1 });

    const result = await redeemActivationToken("token-for-deactivated-user", "NewPassw0rd!");
    expect(result).toEqual({ ok: false, reason: "account_deactivated" });
    expect(deleteMany).toHaveBeenCalledWith({ where: { tokenHash: expect.any(String) } });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects reused tokens — second redemption sees claim.count === 0 (already_used)", async () => {
    findUnique.mockResolvedValue({
      userId: "user-1",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
    });
    userFindUnique.mockResolvedValue({ id: "user-1", active: true });
    // Simulates the row already having been deleted by a prior/concurrent redemption.
    deleteMany.mockResolvedValue({ count: 0 });

    const result = await redeemActivationToken("already-used-token", "NewPassw0rd!");
    expect(result).toEqual({ ok: false, reason: "already_used" });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("hashes the new password before storing (never stores it in plaintext)", async () => {
    findUnique.mockResolvedValue({
      userId: "user-1",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
    });
    userFindUnique.mockResolvedValue({ id: "user-1", active: true });
    deleteMany.mockResolvedValue({ count: 1 });
    userUpdate.mockResolvedValue({});

    await redeemActivationToken("valid-token", "PlaintextPassword123");

    const updateArg = userUpdate.mock.calls[0][0];
    expect(updateArg.data.password).not.toBe("PlaintextPassword123");
    expect(updateArg.data.password).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });

  it("concurrent redemption: only one of two simultaneous calls succeeds", async () => {
    findUnique.mockResolvedValue({
      userId: "user-1",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
    });
    userFindUnique.mockResolvedValue({ id: "user-1", active: true });
    // First deleteMany call claims the row (count:1), second sees it already gone (count:0) —
    // this models Postgres row-locking serializing the two transactions.
    deleteMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    userUpdate.mockResolvedValue({});

    const [r1, r2] = await Promise.all([
      redeemActivationToken("same-token", "NewPassw0rd!"),
      redeemActivationToken("same-token", "NewPassw0rd!"),
    ]);

    const results = [r1, r2];
    const successes = results.filter(r => r.ok);
    const failures = results.filter(r => !r.ok);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect((failures[0] as { ok: false; reason: string }).reason).toBe("already_used");
    expect(userUpdate).toHaveBeenCalledTimes(1);
  });
});
