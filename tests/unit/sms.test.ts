import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCreate = vi.fn().mockResolvedValue({ sid: "SM123" });

vi.mock("twilio", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import twilio from "twilio";
import { sendOtpSms } from "../../apps/web/lib/sms";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── unconfigured (dev fallback) ───────────────────────────────────────────────

describe("sendOtpSms — Twilio not configured", () => {
  beforeEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  it("does not throw when env vars are missing", async () => {
    await expect(sendOtpSms("9876543210", "123456")).resolves.toBeUndefined();
  });

  it("does not call Twilio client when env vars are missing", async () => {
    await sendOtpSms("9876543210", "123456");
    expect(twilio).not.toHaveBeenCalled();
  });
});

// ── successful send ───────────────────────────────────────────────────────────

describe("sendOtpSms — successful send", () => {
  beforeEach(() => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "authtoken";
    process.env.TWILIO_PHONE_NUMBER = "+14155238886";
  });

  afterEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  it("calls messages.create once", async () => {
    await sendOtpSms("9876543210", "654321");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("sends to +91<phone>", async () => {
    await sendOtpSms("9876543210", "654321");
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.to).toBe("+919876543210");
  });

  it("message body contains the OTP", async () => {
    await sendOtpSms("9876543210", "654321");
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.body).toContain("654321");
  });

  it("message body mentions SriLaYa", async () => {
    await sendOtpSms("9876543210", "654321");
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.body).toContain("SriLaYa");
  });

  it("message body mentions 10 minutes validity", async () => {
    await sendOtpSms("9876543210", "654321");
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.body).toContain("10 minutes");
  });

  it("uses TWILIO_PHONE_NUMBER as from address", async () => {
    await sendOtpSms("9876543210", "654321");
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.from).toBe("+14155238886");
  });
});
