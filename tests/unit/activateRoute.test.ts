import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRedeem, mockCheckRateLimit, mockLogEvent, mockLogInfo, mockLogWarn } = vi.hoisted(() => ({
  mockRedeem: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockLogEvent: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
}));

vi.mock("../../apps/web/lib/staffActivation", () => ({
  redeemActivationToken: mockRedeem,
}));

vi.mock("../../apps/web/lib/rateLimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getIp: () => "203.0.113.5",
}));

vi.mock("../../apps/web/lib/logger", () => ({
  logStaffActivationEvent: mockLogEvent,
  log: { info: mockLogInfo, warn: mockLogWarn, error: vi.fn() },
}));

import { POST } from "../../apps/web/app/api/auth/activate/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_TOKEN = "a".repeat(64);

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue(true);
});

describe("POST /api/auth/activate", () => {
  it("rejects a malformed token with the generic error, without calling redeemActivationToken", async () => {
    const res = await POST(makeRequest({ token: "not-a-valid-token", password: "GoodPassword1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid or has expired/i);
    expect(mockRedeem).not.toHaveBeenCalled();
  });

  it("rejects a short password (policy enforcement)", async () => {
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: "short" }));
    expect(res.status).toBe(400);
    expect(mockRedeem).not.toHaveBeenCalled();
  });

  it("returns the generic error for not_found, expired, already_used, and account_deactivated — no enumeration signal", async () => {
    for (const reason of ["not_found", "expired", "already_used", "account_deactivated"] as const) {
      mockRedeem.mockResolvedValueOnce({ ok: false, reason });
      const res = await POST(makeRequest({ token: VALID_TOKEN, password: "GoodPassword1" }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/invalid or has expired/i);
    }
  });

  it("returns success on a valid redemption", async () => {
    mockRedeem.mockResolvedValue({ ok: true, userId: "user-1" });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: "GoodPassword1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("does not set any session cookie on success — activation does not silently log the user in", async () => {
    mockRedeem.mockResolvedValue({ ok: true, userId: "user-1" });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: "GoodPassword1" }));
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("rate-limits by IP and returns 429 without calling redeemActivationToken", async () => {
    mockCheckRateLimit.mockReturnValue(false);
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: "GoodPassword1" }));
    expect(res.status).toBe(429);
    expect(mockRedeem).not.toHaveBeenCalled();
  });

  it("never logs the raw token or password on any path", async () => {
    mockRedeem.mockResolvedValue({ ok: false, reason: "not_found" });
    await POST(makeRequest({ token: VALID_TOKEN, password: "SuperSecretPassword1" }));

    for (const call of mockLogEvent.mock.calls) {
      const serialized = JSON.stringify(call);
      expect(serialized).not.toContain(VALID_TOKEN);
      expect(serialized).not.toContain("SuperSecretPassword1");
    }
  });

  it("logs a redeemed event with only the userId on success", async () => {
    mockRedeem.mockResolvedValue({ ok: true, userId: "user-42" });
    await POST(makeRequest({ token: VALID_TOKEN, password: "GoodPassword1" }));

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-42", result: "redeemed" }),
    );
  });
});
