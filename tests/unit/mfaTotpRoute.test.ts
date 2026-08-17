import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ── hoisted mock references ───────────────────────────────────────────────────
// vi.hoisted ensures these are available inside vi.mock factory functions,
// which are hoisted to the top of the file by Vitest's transform.

const mockGetToken = vi.hoisted(() => vi.fn());
const mockEncode = vi.hoisted(() => vi.fn());
const mockTotpVerify = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());
const mockLogFlush = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockRecordAttempt = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock("next-axiom", () => ({
  Logger: class {
    info = vi.fn();
    warn = vi.fn();
    error = mockLogError;
    flush = mockLogFlush;
  },
}));

vi.mock("next-auth/jwt", () => ({
  getToken: mockGetToken,
  encode: mockEncode,
}));

vi.mock("otplib", () => ({
  TOTP: class {
    verify = mockTotpVerify;
  },
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
  },
}));

vi.mock("../../apps/web/lib/totp", () => ({
  decryptTotpSecret: vi.fn().mockReturnValue("TESTSECRET"),
}));

vi.mock("../../apps/web/lib/mfaTotpRateLimit", () => ({
  checkMfaRateLimit: mockCheckRateLimit,
  recordMfaAttempt: mockRecordAttempt,
  MAX_FAILS: 5,
}));

// ── import after mocks ────────────────────────────────────────────────────────

import { POST } from "../../apps/web/app/api/auth/mfa-verify/route";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(code = "123456"): NextRequest {
  return new Request("http://localhost/api/auth/mfa-verify", {
    method: "POST",
    body: JSON.stringify({ code }),
    headers: { "Content-Type": "application/json" },
  }) as unknown as NextRequest;
}

// ── defaults ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockGetToken.mockResolvedValue({ id: "user-1", totpPending: true });
  mockEncode.mockResolvedValue("encoded-token");
  mockCheckRateLimit.mockResolvedValue(true);
  mockRecordAttempt.mockResolvedValue(undefined);
  mockTotpVerify.mockReturnValue(true);
  mockLogFlush.mockResolvedValue(undefined);
  mockUserFindUnique.mockResolvedValue({
    id: "user-1",
    totpEnabled: true,
    totpSecret: "enc:fake",
  });
});

// ── rate-limit DB failure → 503 ───────────────────────────────────────────────

describe("rate-limit check failure", () => {
  it("returns 503 when checkMfaRateLimit throws", async () => {
    mockCheckRateLimit.mockRejectedValue(new Error("db down"));
    const res = await POST(makeRequest());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "Service temporarily unavailable" });
  });

  it("logs userId but not the TOTP code on rate-limit failure", async () => {
    mockCheckRateLimit.mockRejectedValue(new Error("db down"));
    await POST(makeRequest("654321"));
    expect(mockLogError).toHaveBeenCalled();
    const logged = JSON.stringify(mockLogError.mock.calls);
    expect(logged).not.toContain("654321");
    expect(logged).toContain("user-1");
  });
});

// ── lockout → 429 ─────────────────────────────────────────────────────────────

describe("lockout", () => {
  it("returns 429 when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue(false);
    const res = await POST(makeRequest());
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining("Too many failed") });
  });

  it("does not call recordMfaAttempt when locked out", async () => {
    mockCheckRateLimit.mockResolvedValue(false);
    await POST(makeRequest());
    expect(mockRecordAttempt).not.toHaveBeenCalled();
  });

  it("does not log sensitive values on lockout response", async () => {
    mockCheckRateLimit.mockResolvedValue(false);
    await POST(makeRequest("111111"));
    // no log.error expected on plain lockout
    expect(mockLogError).not.toHaveBeenCalled();
    // confirm no TOTP code in any log call
    const logged = JSON.stringify(mockLogError.mock.calls);
    expect(logged).not.toContain("111111");
  });
});

// ── invalid code + recording failure → 503 ───────────────────────────────────

describe("invalid code with recording failure", () => {
  it("returns 503 when recording a failed attempt throws", async () => {
    mockTotpVerify.mockReturnValue(false);
    mockRecordAttempt.mockRejectedValue(new Error("insert failed"));
    const res = await POST(makeRequest());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "Service temporarily unavailable" });
  });

  it("does not include the TOTP code in the error log", async () => {
    mockTotpVerify.mockReturnValue(false);
    mockRecordAttempt.mockRejectedValue(new Error("insert failed"));
    await POST(makeRequest("999999"));
    expect(mockLogError).toHaveBeenCalled();
    const logged = JSON.stringify(mockLogError.mock.calls);
    expect(logged).not.toContain("999999");
  });
});

// ── valid code + recording failure → still 200 ───────────────────────────────

describe("valid code with recording failure", () => {
  it("returns 200 and sets cookie even when recording throws", async () => {
    mockTotpVerify.mockReturnValue(true);
    mockRecordAttempt.mockRejectedValue(new Error("insert failed"));
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true });
  });

  it("logs an error server-side but not the TOTP code", async () => {
    mockTotpVerify.mockReturnValue(true);
    mockRecordAttempt.mockRejectedValue(new Error("insert failed"));
    await POST(makeRequest("888888"));
    expect(mockLogError).toHaveBeenCalled();
    const logged = JSON.stringify(mockLogError.mock.calls);
    expect(logged).not.toContain("888888");
  });
});
