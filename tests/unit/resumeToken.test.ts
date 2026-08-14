import { describe, it, expect, beforeAll } from "vitest";
import {
  createResumeToken,
  verifyResumeToken,
  buildOrderExpiredEmail,
} from "../../apps/web/lib/emails/orderExpired";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-resume-token-tests";
  process.env.NEXT_PUBLIC_APP_URL = "https://srilaya.com";
});

// ── createResumeToken — format ─────────────────────────────────────────────────

describe("createResumeToken — format", () => {
  it("returns a non-empty base64url string", () => {
    const token = createResumeToken("order-abc");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("different orderId → different token", () => {
    expect(createResumeToken("order-1")).not.toBe(createResumeToken("order-2"));
  });

  it("tokens for different orderIds are always different", () => {
    expect(createResumeToken("order-A")).not.toBe(createResumeToken("order-B"));
  });
});

// ── round-trip ────────────────────────────────────────────────────────────────

describe("createResumeToken / verifyResumeToken round-trip", () => {
  it("returns the original orderId for a freshly created token", () => {
    const orderId = "order-xyz-123";
    const token = createResumeToken(orderId);
    expect(verifyResumeToken(token)).toBe(orderId);
  });

  it("returns null for an empty string", () => {
    expect(verifyResumeToken("")).toBeNull();
  });

  it("returns null for a random garbage string", () => {
    expect(verifyResumeToken("notavalidtoken")).toBeNull();
  });

  it("returns null when the signature is tampered", () => {
    const orderId = "order-tamper";
    const token = createResumeToken(orderId);
    // decode, replace the signature with garbage, re-encode
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    parts[2] = "a".repeat(parts[2].length); // replace hex signature with all-a's
    const tampered = Buffer.from(parts.join(":")).toString("base64url");
    expect(verifyResumeToken(tampered)).toBeNull();
  });

  it("returns null for an expired token", () => {
    // Create a token then wind the clock past 7 days
    const token = createResumeToken("order-expired");

    const realDateNow = Date.now;
    Date.now = () => realDateNow() + 8 * 24 * 60 * 60 * 1000; // +8 days

    try {
      expect(verifyResumeToken(token)).toBeNull();
    } finally {
      Date.now = realDateNow;
    }
  });
});

// ── buildOrderExpiredEmail ─────────────────────────────────────────────────────

const sampleArgs = {
  customerName: "Priya",
  orderId: "clxyz001",
  items: [
    { title: "Ragi Flakes", size: "500g", quantity: 2 },
    { title: "Foxtail Millet", size: "1kg", quantity: 1 },
  ],
  total: 398,
};

describe("buildOrderExpiredEmail", () => {
  it("returns an object with html and resumeUrl keys", () => {
    const result = buildOrderExpiredEmail(sampleArgs);
    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("resumeUrl");
  });

  it("html contains the customer name", () => {
    const { html } = buildOrderExpiredEmail(sampleArgs);
    expect(html).toContain("Priya");
  });

  it("html contains each item title", () => {
    const { html } = buildOrderExpiredEmail(sampleArgs);
    expect(html).toContain("Ragi Flakes");
    expect(html).toContain("Foxtail Millet");
  });

  it("html contains the formatted total", () => {
    const { html } = buildOrderExpiredEmail(sampleArgs);
    expect(html).toContain("398.00");
  });

  it("resumeUrl contains the app URL and a token", () => {
    const { resumeUrl } = buildOrderExpiredEmail(sampleArgs);
    expect(resumeUrl).toContain("https://srilaya.com/checkout/resume/");
    // token part should be a non-empty base64url string
    const token = resumeUrl.split("/checkout/resume/")[1];
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("the token embedded in resumeUrl decodes back to the orderId", () => {
    const { resumeUrl } = buildOrderExpiredEmail(sampleArgs);
    const token = resumeUrl.split("/checkout/resume/")[1];
    expect(verifyResumeToken(token)).toBe("clxyz001");
  });

  it("falls back to 'there' when customerName is empty", () => {
    const { html } = buildOrderExpiredEmail({ ...sampleArgs, customerName: "" });
    expect(html).toContain("Hi there");
  });
});
