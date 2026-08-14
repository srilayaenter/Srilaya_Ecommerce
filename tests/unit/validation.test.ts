import { describe, it, expect } from "vitest";
import {
  TrackOrderSchema,
  MfaVerifySchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  CancelOrderSchema,
  CouponApplySchema,
  NotifyStockSchema,
  ReturnRequestSchema,
} from "../../apps/web/lib/validation";

// ── helpers ───────────────────────────────────────────────────────────────────

function ok<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, value: unknown) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(true);
  return result;
}

function fail(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) {
  expect(schema.safeParse(value).success).toBe(false);
}

// ── TrackOrderSchema ──────────────────────────────────────────────────────────

describe("TrackOrderSchema", () => {
  it("accepts valid orderId + contact", () => {
    ok(TrackOrderSchema, { orderId: "ORD-001", contact: "test@example.com" });
  });

  it("accepts alphanumeric orderId with # and -", () => {
    ok(TrackOrderSchema, { orderId: "ORD#2024-001", contact: "9876543210" });
  });

  it("rejects empty orderId", () => {
    fail(TrackOrderSchema, { orderId: "", contact: "test@example.com" });
  });

  it("rejects orderId with special chars like spaces", () => {
    fail(TrackOrderSchema, { orderId: "ORD 001", contact: "test@example.com" });
  });

  it("rejects orderId over 64 chars", () => {
    fail(TrackOrderSchema, { orderId: "A".repeat(65), contact: "test@example.com" });
  });

  it("rejects empty contact", () => {
    fail(TrackOrderSchema, { orderId: "ORD-001", contact: "" });
  });

  it("rejects contact over 100 chars", () => {
    fail(TrackOrderSchema, { orderId: "ORD-001", contact: "a".repeat(101) });
  });

  it("rejects missing fields", () => {
    fail(TrackOrderSchema, { orderId: "ORD-001" });
    fail(TrackOrderSchema, { contact: "test@example.com" });
    fail(TrackOrderSchema, {});
  });
});

// ── MfaVerifySchema ───────────────────────────────────────────────────────────

describe("MfaVerifySchema", () => {
  it("accepts a valid 6-digit code", () => {
    ok(MfaVerifySchema, { code: "123456" });
    ok(MfaVerifySchema, { code: "000000" });
    ok(MfaVerifySchema, { code: "999999" });
  });

  it("rejects 5-digit code", () => {
    fail(MfaVerifySchema, { code: "12345" });
  });

  it("rejects 7-digit code", () => {
    fail(MfaVerifySchema, { code: "1234567" });
  });

  it("rejects code with letters", () => {
    fail(MfaVerifySchema, { code: "12345a" });
    fail(MfaVerifySchema, { code: "ABCDEF" });
  });

  it("rejects code with spaces", () => {
    fail(MfaVerifySchema, { code: "123 45" });
  });

  it("rejects empty code", () => {
    fail(MfaVerifySchema, { code: "" });
  });
});

// ── ForgotPasswordSchema ──────────────────────────────────────────────────────

describe("ForgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    ok(ForgotPasswordSchema, { email: "user@example.com" });
  });

  it("rejects invalid email format", () => {
    fail(ForgotPasswordSchema, { email: "not-an-email" });
    fail(ForgotPasswordSchema, { email: "missing@" });
    fail(ForgotPasswordSchema, { email: "@nodomain.com" });
  });

  it("rejects email over 200 chars", () => {
    fail(ForgotPasswordSchema, { email: "a".repeat(195) + "@test.com" });
  });

  it("rejects empty email", () => {
    fail(ForgotPasswordSchema, { email: "" });
  });
});

// ── ResetPasswordSchema ───────────────────────────────────────────────────────

describe("ResetPasswordSchema", () => {
  const validToken = "a".repeat(32);

  it("accepts valid token + password", () => {
    ok(ResetPasswordSchema, { token: validToken, password: "securepass" });
  });

  it("rejects password under 8 chars", () => {
    fail(ResetPasswordSchema, { token: validToken, password: "short" });
    fail(ResetPasswordSchema, { token: validToken, password: "1234567" });
  });

  it("accepts password exactly 8 chars", () => {
    ok(ResetPasswordSchema, { token: validToken, password: "12345678" });
  });

  it("rejects password over 128 chars", () => {
    fail(ResetPasswordSchema, { token: validToken, password: "a".repeat(129) });
  });

  it("rejects token under 32 chars", () => {
    fail(ResetPasswordSchema, { token: "short-token", password: "securepass" });
  });

  it("rejects token over 128 chars", () => {
    fail(ResetPasswordSchema, { token: "a".repeat(129), password: "securepass" });
  });
});

// ── CancelOrderSchema ─────────────────────────────────────────────────────────

describe("CancelOrderSchema", () => {
  it("accepts valid orderId + email", () => {
    ok(CancelOrderSchema, { orderId: "ORD-001", email: "user@example.com" });
  });

  it("rejects empty orderId", () => {
    fail(CancelOrderSchema, { orderId: "", email: "user@example.com" });
  });

  it("rejects invalid email", () => {
    fail(CancelOrderSchema, { orderId: "ORD-001", email: "not-an-email" });
  });
});

// ── CouponApplySchema ─────────────────────────────────────────────────────────

describe("CouponApplySchema", () => {
  it("accepts valid code + orderTotal", () => {
    ok(CouponApplySchema, { code: "SAVE10", orderTotal: 500 });
    ok(CouponApplySchema, { code: "FLAT-50", orderTotal: 1000.50 });
  });

  it("rejects code with spaces", () => {
    fail(CouponApplySchema, { code: "SAVE 10", orderTotal: 500 });
  });

  it("rejects code with special chars beyond - and _", () => {
    fail(CouponApplySchema, { code: "SAVE@10", orderTotal: 500 });
    fail(CouponApplySchema, { code: "SAVE#10", orderTotal: 500 });
  });

  it("rejects empty code", () => {
    fail(CouponApplySchema, { code: "", orderTotal: 500 });
  });

  it("rejects code over 50 chars", () => {
    fail(CouponApplySchema, { code: "A".repeat(51), orderTotal: 500 });
  });

  it("rejects zero orderTotal", () => {
    fail(CouponApplySchema, { code: "SAVE10", orderTotal: 0 });
  });

  it("rejects negative orderTotal", () => {
    fail(CouponApplySchema, { code: "SAVE10", orderTotal: -100 });
  });
});

// ── NotifyStockSchema ─────────────────────────────────────────────────────────

describe("NotifyStockSchema", () => {
  it("accepts valid email + variantId", () => {
    ok(NotifyStockSchema, { email: "user@example.com", variantId: "clxyz123" });
  });

  it("rejects invalid email", () => {
    fail(NotifyStockSchema, { email: "not-an-email", variantId: "clxyz123" });
  });

  it("rejects empty variantId", () => {
    fail(NotifyStockSchema, { email: "user@example.com", variantId: "" });
  });

  it("rejects variantId over 64 chars", () => {
    fail(NotifyStockSchema, { email: "user@example.com", variantId: "a".repeat(65) });
  });
});

// ── ReturnRequestSchema ───────────────────────────────────────────────────────

describe("ReturnRequestSchema", () => {
  const validItem = {
    variantId: "clxyz123",
    title: "Ragi Flakes",
    size: "500g",
    quantity: 1,
  };

  it("accepts a valid return request", () => {
    ok(ReturnRequestSchema, {
      orderId: "ORD-001",
      contact: "user@example.com",
      reason: "Product was damaged on arrival",
      items: [validItem],
    });
  });

  it("accepts multiple items", () => {
    ok(ReturnRequestSchema, {
      orderId: "ORD-001",
      contact: "9876543210",
      reason: "Wrong items received in order",
      items: [validItem, { ...validItem, variantId: "clxyz456", quantity: 2 }],
    });
  });

  it("rejects empty items array", () => {
    fail(ReturnRequestSchema, {
      orderId: "ORD-001",
      contact: "user@example.com",
      reason: "Valid reason here",
      items: [],
    });
  });

  it("rejects reason under 5 chars", () => {
    fail(ReturnRequestSchema, {
      orderId: "ORD-001",
      contact: "user@example.com",
      reason: "Bad",
      items: [validItem],
    });
  });

  it("rejects reason over 500 chars", () => {
    fail(ReturnRequestSchema, {
      orderId: "ORD-001",
      contact: "user@example.com",
      reason: "a".repeat(501),
      items: [validItem],
    });
  });

  it("rejects item with zero quantity", () => {
    fail(ReturnRequestSchema, {
      orderId: "ORD-001",
      contact: "user@example.com",
      reason: "Valid reason here",
      items: [{ ...validItem, quantity: 0 }],
    });
  });

  it("rejects item with negative quantity", () => {
    fail(ReturnRequestSchema, {
      orderId: "ORD-001",
      contact: "user@example.com",
      reason: "Valid reason here",
      items: [{ ...validItem, quantity: -1 }],
    });
  });

  it("rejects item with non-integer quantity", () => {
    fail(ReturnRequestSchema, {
      orderId: "ORD-001",
      contact: "user@example.com",
      reason: "Valid reason here",
      items: [{ ...validItem, quantity: 1.5 }],
    });
  });

  it("rejects empty orderId", () => {
    fail(ReturnRequestSchema, {
      orderId: "",
      contact: "user@example.com",
      reason: "Valid reason here",
      items: [validItem],
    });
  });

  it("rejects missing contact", () => {
    fail(ReturnRequestSchema, {
      orderId: "ORD-001",
      reason: "Valid reason here",
      items: [validItem],
    });
  });
});
