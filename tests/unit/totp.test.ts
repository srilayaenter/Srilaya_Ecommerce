import { describe, it, expect, beforeAll } from "vitest";
import { encryptTotpSecret, decryptTotpSecret } from "../../apps/web/lib/totp";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-totp-unit-tests";
});

// ── format ────────────────────────────────────────────────────────────────────

describe("encryptTotpSecret — output format", () => {
  it("returns a string starting with 'enc:'", () => {
    const result = encryptTotpSecret("JBSWY3DPEHPK3PXP");
    expect(result.startsWith("enc:")).toBe(true);
  });

  it("returns three colon-separated parts: enc:<ivHex>:<cipherHex>", () => {
    const result = encryptTotpSecret("JBSWY3DPEHPK3PXP");
    const parts = result.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("enc");
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/); // 16 bytes = 32 hex chars
    expect(parts[2]).toMatch(/^[0-9a-f]+$/);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const a = encryptTotpSecret("SAME_SECRET");
    const b = encryptTotpSecret("SAME_SECRET");
    expect(a).not.toBe(b);
  });
});

// ── round-trip ────────────────────────────────────────────────────────────────

describe("encryptTotpSecret / decryptTotpSecret round-trip", () => {
  it("decrypts back to the original plain value", () => {
    const plain = "JBSWY3DPEHPK3PXP";
    expect(decryptTotpSecret(encryptTotpSecret(plain))).toBe(plain);
  });

  it("handles a short secret", () => {
    const plain = "AB";
    expect(decryptTotpSecret(encryptTotpSecret(plain))).toBe(plain);
  });

  it("handles a long secret (64 chars)", () => {
    const plain = "A".repeat(64);
    expect(decryptTotpSecret(encryptTotpSecret(plain))).toBe(plain);
  });

  it("handles special characters in the secret", () => {
    const plain = "SECRET_with-Special+Chars=";
    expect(decryptTotpSecret(encryptTotpSecret(plain))).toBe(plain);
  });
});

// ── legacy plain value passthrough ────────────────────────────────────────────

describe("decryptTotpSecret — legacy plain value", () => {
  it("returns the value as-is when it does not start with 'enc:'", () => {
    expect(decryptTotpSecret("LEGACYPLAINVALUE")).toBe("LEGACYPLAINVALUE");
  });

  it("does not corrupt a legacy value that looks like a TOTP secret", () => {
    const legacy = "JBSWY3DPEHPK3PXP";
    expect(decryptTotpSecret(legacy)).toBe(legacy);
  });
});
