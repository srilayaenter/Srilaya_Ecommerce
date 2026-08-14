import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, mockFailedEmailCreate } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockFailedEmailCreate: vi.fn(),
}));

// Use a class so `new Resend(key)` works without "not a constructor" errors
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: { failedEmail: { create: mockFailedEmailCreate } },
}));

import { sendEmail } from "../../apps/web/lib/email";

const baseParams = {
  to: "customer@example.com",
  subject: "Order Confirmed",
  html: "<p>Your order is confirmed.</p>",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockResolvedValue({ id: "resend-msg-001" });
  mockFailedEmailCreate.mockResolvedValue({});
});

// ── missing RESEND_API_KEY ────────────────────────────────────────────────────

describe("sendEmail — missing RESEND_API_KEY", () => {
  beforeEach(() => { delete process.env.RESEND_API_KEY; });
  afterEach(() => { delete process.env.RESEND_API_KEY; });

  it("returns success:false when RESEND_API_KEY is not set", async () => {
    const result = await sendEmail(baseParams);
    expect(result.success).toBe(false);
  });

  it("returns a descriptive error string", async () => {
    const result = await sendEmail(baseParams);
    expect(result.error).toBeTruthy();
  });

  it("logs the failure to the database", async () => {
    await sendEmail(baseParams);
    expect(mockFailedEmailCreate).toHaveBeenCalledTimes(1);
    const data = mockFailedEmailCreate.mock.calls[0][0].data;
    expect(data.to).toBe("customer@example.com");
    expect(data.subject).toBe("Order Confirmed");
  });

  it("does NOT call Resend send when API key is absent", async () => {
    await sendEmail(baseParams);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

// ── successful send ───────────────────────────────────────────────────────────

describe("sendEmail — successful send", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "noreply@srilaya.com";
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("returns success:true on a successful send", async () => {
    const result = await sendEmail(baseParams);
    expect(result.success).toBe(true);
  });

  it("calls Resend send exactly once on first attempt", async () => {
    await sendEmail(baseParams);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("does not log a failed email on success", async () => {
    await sendEmail(baseParams);
    expect(mockFailedEmailCreate).not.toHaveBeenCalled();
  });

  it("works when EMAIL_FROM is not set (uses fallback)", async () => {
    delete process.env.EMAIL_FROM;
    const result = await sendEmail(baseParams);
    expect(result.success).toBe(true);
  });
});

// ── failure and retry ─────────────────────────────────────────────────────────

describe("sendEmail — Resend throws (fake timers)", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key";
    mockSend.mockRejectedValue(new Error("Network error"));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.RESEND_API_KEY;
  });

  it("returns success:false after all retries are exhausted", async () => {
    const promise = sendEmail(baseParams);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.success).toBe(false);
  });

  it("logs the failure to the database after exhausting retries", async () => {
    const promise = sendEmail(baseParams);
    await vi.runAllTimersAsync();
    await promise;
    expect(mockFailedEmailCreate).toHaveBeenCalledTimes(1);
    const data = mockFailedEmailCreate.mock.calls[0][0].data;
    expect(data.errorMessage).toContain("Network error");
  });

  it("retries 3 times before giving up", async () => {
    const promise = sendEmail(baseParams);
    await vi.runAllTimersAsync();
    await promise;
    expect(mockSend).toHaveBeenCalledTimes(3);
  });
});
