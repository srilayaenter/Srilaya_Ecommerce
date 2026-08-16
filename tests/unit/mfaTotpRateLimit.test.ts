import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    mfaTotpAttempt: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { checkMfaRateLimit, recordMfaAttempt, MAX_FAILS } from "../../apps/web/lib/mfaTotpRateLimit";
import { prisma } from "../../apps/web/lib/db";

const mockCount = vi.mocked(prisma.mfaTotpAttempt.count);
const mockCreate = vi.mocked(prisma.mfaTotpAttempt.create);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── T11: exported constant ────────────────────────────────────────────────────

describe("MAX_FAILS", () => {
  it("is 5", () => {
    expect(MAX_FAILS).toBe(5);
  });
});

// ── T01–T07: checkMfaRateLimit ────────────────────────────────────────────────

describe("checkMfaRateLimit", () => {
  it("T01: allows when 0 failures in window", async () => {
    mockCount.mockResolvedValue(0);
    expect(await checkMfaRateLimit("user-1")).toBe(true);
  });

  it("T02: allows when 4 failures in window (one below limit)", async () => {
    mockCount.mockResolvedValue(4);
    expect(await checkMfaRateLimit("user-1")).toBe(true);
  });

  it("T03: blocks when exactly 5 failures in window (at limit)", async () => {
    mockCount.mockResolvedValue(5);
    expect(await checkMfaRateLimit("user-1")).toBe(false);
  });

  it("T04: blocks when more than 5 failures in window", async () => {
    mockCount.mockResolvedValue(8);
    expect(await checkMfaRateLimit("user-1")).toBe(false);
  });

  it("T05: allows after window expiry — count naturally drops to 0", async () => {
    // The DB query filters by attemptedAt >= cutoff; stale rows are excluded
    // automatically. Mock simulates an empty result after expiry.
    mockCount.mockResolvedValue(0);
    expect(await checkMfaRateLimit("user-1")).toBe(true);
  });

  it("T06: successes in window do not count toward failure limit", async () => {
    // The query filters succeeded=false, so succeeded=true rows are excluded.
    // Mock returns 5 failures even though successes are present in the real DB.
    mockCount.mockResolvedValue(5);
    expect(await checkMfaRateLimit("user-1")).toBe(false);
  });

  it("T07: throws when DB count query throws", async () => {
    mockCount.mockRejectedValue(new Error("connection lost"));
    await expect(checkMfaRateLimit("user-1")).rejects.toThrow("connection lost");
  });

  // ── T12: where-clause shape ───────────────────────────────────────────────

  it("T12: where clause filters userId, succeeded=false, and attemptedAt >= 15-min cutoff", async () => {
    mockCount.mockResolvedValue(0);

    const beforeCall = new Date(Date.now() - 15 * 60 * 1000 - 100);
    await checkMfaRateLimit("user-abc");
    const afterCall = new Date(Date.now() - 15 * 60 * 1000 + 100);

    expect(mockCount).toHaveBeenCalledOnce();
    const [callArg] = mockCount.mock.calls[0] as [{ where: Record<string, unknown> }];

    expect(callArg.where.userId).toBe("user-abc");
    expect(callArg.where.succeeded).toBe(false);

    const cutoff = (callArg.where.attemptedAt as { gte: Date }).gte;
    expect(cutoff).toBeInstanceOf(Date);
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(cutoff.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });
});

// ── T08–T10: recordMfaAttempt ─────────────────────────────────────────────────

describe("recordMfaAttempt", () => {
  it("T08: inserts a row with succeeded=false for a failed attempt", async () => {
    mockCreate.mockResolvedValue({} as never);
    await recordMfaAttempt("user-1", false);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: "user-1", succeeded: false },
    });
  });

  it("T09: inserts a row with succeeded=true for a successful attempt", async () => {
    mockCreate.mockResolvedValue({} as never);
    await recordMfaAttempt("user-1", true);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: "user-1", succeeded: true },
    });
  });

  it("T10: throws when DB insert throws", async () => {
    mockCreate.mockRejectedValue(new Error("insert failed"));
    await expect(recordMfaAttempt("user-1", false)).rejects.toThrow("insert failed");
  });
});
