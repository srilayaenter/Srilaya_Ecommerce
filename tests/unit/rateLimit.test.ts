import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, getIp } from "../../apps/web/lib/rateLimit";

// ── helpers ───────────────────────────────────────────────────────────────────

// Each test gets a unique key prefix so tests never share state
let keyCounter = 0;
function uniqueKey(label: string) {
  return `test:${label}:${++keyCounter}`;
}

// ── checkRateLimit ────────────────────────────────────────────────────────────

describe("checkRateLimit — basic allow/block", () => {
  it("allows the first request", () => {
    expect(checkRateLimit(uniqueKey("first"), 3, 60_000)).toBe(true);
  });

  it("allows up to maxRequests within window", () => {
    const key = uniqueKey("up-to-max");
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("blocks the (maxRequests + 1)th request", () => {
    const key = uniqueKey("block-overflow");
    checkRateLimit(key, 3, 60_000);
    checkRateLimit(key, 3, 60_000);
    checkRateLimit(key, 3, 60_000);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("continues blocking after limit is hit", () => {
    const key = uniqueKey("stays-blocked");
    for (let i = 0; i < 5; i++) checkRateLimit(key, 3, 60_000);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("maxRequests=1 blocks second request immediately", () => {
    const key = uniqueKey("max-1");
    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
    expect(checkRateLimit(key, 1, 60_000)).toBe(false);
  });
});

describe("checkRateLimit — key isolation", () => {
  it("different keys have independent counters", () => {
    const keyA = uniqueKey("iso-a");
    const keyB = uniqueKey("iso-b");
    checkRateLimit(keyA, 2, 60_000);
    checkRateLimit(keyA, 2, 60_000);
    // keyA is now exhausted; keyB should still allow
    expect(checkRateLimit(keyA, 2, 60_000)).toBe(false);
    expect(checkRateLimit(keyB, 2, 60_000)).toBe(true);
  });

  it("coupon key and otp key don't interfere", () => {
    const couponKey = uniqueKey("coupon:1.2.3.4");
    const otpKey    = uniqueKey("otp:1.2.3.4");
    for (let i = 0; i < 20; i++) checkRateLimit(couponKey, 20, 60_000);
    // coupon exhausted — otp must still be independent
    expect(checkRateLimit(otpKey, 5, 60_000)).toBe(true);
  });
});

describe("checkRateLimit — window expiry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("resets counter after window expires", () => {
    const key = uniqueKey("window-reset");
    const MAX = 3;
    const WINDOW = 1_000; // 1 second for test speed

    // exhaust the limit
    for (let i = 0; i < MAX; i++) checkRateLimit(key, MAX, WINDOW);
    expect(checkRateLimit(key, MAX, WINDOW)).toBe(false);

    // advance past the window
    vi.advanceTimersByTime(WINDOW + 1);

    // counter should have reset — first request allowed again
    expect(checkRateLimit(key, MAX, WINDOW)).toBe(true);
  });

  it("does not reset before window expires", () => {
    const key = uniqueKey("no-early-reset");
    const MAX = 2;
    const WINDOW = 5_000;

    checkRateLimit(key, MAX, WINDOW);
    checkRateLimit(key, MAX, WINDOW);
    expect(checkRateLimit(key, MAX, WINDOW)).toBe(false);

    // advance to just before window end
    vi.advanceTimersByTime(WINDOW - 1);
    expect(checkRateLimit(key, MAX, WINDOW)).toBe(false);
  });

  it("allows a full new batch after window reset", () => {
    const key = uniqueKey("full-batch-after-reset");
    const MAX = 3;
    const WINDOW = 1_000;

    for (let i = 0; i < MAX; i++) checkRateLimit(key, MAX, WINDOW);
    vi.advanceTimersByTime(WINDOW + 1);

    // full batch should be available again
    expect(checkRateLimit(key, MAX, WINDOW)).toBe(true);
    expect(checkRateLimit(key, MAX, WINDOW)).toBe(true);
    expect(checkRateLimit(key, MAX, WINDOW)).toBe(true);
    expect(checkRateLimit(key, MAX, WINDOW)).toBe(false); // 4th blocked again
  });

  it("restores fake timers after each test", () => {
    vi.useRealTimers();
  });
});

describe("checkRateLimit — real-world limits match endpoint config", () => {
  it("coupon endpoint: 20 requests allowed, 21st blocked", () => {
    const key = uniqueKey("coupon-endpoint");
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit(key, 20, 60 * 60 * 1000)).toBe(true);
    }
    expect(checkRateLimit(key, 20, 60 * 60 * 1000)).toBe(false);
  });

  it("returns true on first request regardless of window size", () => {
    // sanity: a fresh key always passes — window size doesn't matter
    expect(checkRateLimit(uniqueKey("short-window"), 5, 100)).toBe(true);
    expect(checkRateLimit(uniqueKey("long-window"), 5, 999_999_999)).toBe(true);
  });
});

// ── getIp ─────────────────────────────────────────────────────────────────────

describe("getIp", () => {
  function makeRequest(headers: Record<string, string>): Request {
    return new Request("https://example.com", { headers });
  }

  it("reads the first IP from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getIp(req)).toBe("1.2.3.4");
  });

  it("handles a single IP with no comma", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" });
    expect(getIp(req)).toBe("1.2.3.4");
  });

  it("trims whitespace from IP", () => {
    const req = makeRequest({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" });
    expect(getIp(req)).toBe("1.2.3.4");
  });

  it("falls back to 'unknown' when header is missing", () => {
    const req = makeRequest({});
    expect(getIp(req)).toBe("unknown");
  });

  it("falls back to 'unknown' when header is empty string", () => {
    const req = makeRequest({ "x-forwarded-for": "" });
    expect(getIp(req)).toBe("unknown");
  });
});
