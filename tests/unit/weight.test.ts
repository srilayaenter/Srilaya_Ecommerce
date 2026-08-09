import { describe, it, expect } from "vitest";
import { deriveWeightGramsFromSize } from "@/lib/weight";

describe("deriveWeightGramsFromSize", () => {
  // ── gram inputs ──────────────────────────────────────────────────────────
  it("parses plain grams: '500g' → 500", () => {
    expect(deriveWeightGramsFromSize("500g")).toBe(500);
  });

  it("parses '250g' → 250", () => {
    expect(deriveWeightGramsFromSize("250g")).toBe(250);
  });

  it("parses '100g' → 100", () => {
    expect(deriveWeightGramsFromSize("100g")).toBe(100);
  });

  it("parses 'gram' unit: '500gram' → 500", () => {
    expect(deriveWeightGramsFromSize("500gram")).toBe(500);
  });

  it("parses 'grams' unit: '500grams' → 500", () => {
    expect(deriveWeightGramsFromSize("500grams")).toBe(500);
  });

  it("parses 'gm' unit: '500gm' → 500", () => {
    expect(deriveWeightGramsFromSize("500gm")).toBe(500);
  });

  it("allows space between number and unit: '500 g' → 500", () => {
    expect(deriveWeightGramsFromSize("500 g")).toBe(500);
  });

  // ── kilogram inputs ───────────────────────────────────────────────────────
  it("parses '1kg' → 1000", () => {
    expect(deriveWeightGramsFromSize("1kg")).toBe(1000);
  });

  it("parses '2kg' → 2000", () => {
    expect(deriveWeightGramsFromSize("2kg")).toBe(2000);
  });

  it("parses '2 kg' with space → 2000", () => {
    expect(deriveWeightGramsFromSize("2 kg")).toBe(2000);
  });

  it("parses fractional kg: '0.5kg' → 500", () => {
    expect(deriveWeightGramsFromSize("0.5kg")).toBe(500);
  });

  it("parses '1.5kg' → 1500", () => {
    expect(deriveWeightGramsFromSize("1.5kg")).toBe(1500);
  });

  // ── case insensitivity ────────────────────────────────────────────────────
  it("is case-insensitive: '500G' → 500", () => {
    expect(deriveWeightGramsFromSize("500G")).toBe(500);
  });

  it("is case-insensitive: '1KG' → 1000", () => {
    expect(deriveWeightGramsFromSize("1KG")).toBe(1000);
  });

  it("is case-insensitive: '1Kg' → 1000", () => {
    expect(deriveWeightGramsFromSize("1Kg")).toBe(1000);
  });

  // ── bare number (no unit — defaults to grams) ─────────────────────────────
  it("bare number with no unit defaults to grams: '500' → 500", () => {
    expect(deriveWeightGramsFromSize("500")).toBe(500);
  });

  // ── rounding ──────────────────────────────────────────────────────────────
  it("rounds fractional grams: '500.6g' → 501", () => {
    expect(deriveWeightGramsFromSize("500.6g")).toBe(501);
  });

  it("rounds fractional kg conversion: '1.0005kg' → 1001", () => {
    expect(deriveWeightGramsFromSize("1.0005kg")).toBe(1001);
  });

  // ── null / empty / falsy inputs ───────────────────────────────────────────
  it("returns null for null", () => {
    expect(deriveWeightGramsFromSize(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(deriveWeightGramsFromSize(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(deriveWeightGramsFromSize("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(deriveWeightGramsFromSize("   ")).toBeNull();
  });

  // ── non-parseable size labels ─────────────────────────────────────────────
  it("returns null for free-text like 'Small'", () => {
    expect(deriveWeightGramsFromSize("Small")).toBeNull();
  });

  it("returns null for 'Combo Pack'", () => {
    expect(deriveWeightGramsFromSize("Combo Pack")).toBeNull();
  });

  it("returns null for number with unknown unit: '500ml'", () => {
    expect(deriveWeightGramsFromSize("500ml")).toBeNull();
  });

  it("returns null for number with unknown unit: '1L'", () => {
    expect(deriveWeightGramsFromSize("1L")).toBeNull();
  });

  // ── zero / negative guard ─────────────────────────────────────────────────
  it("returns null for '0g'", () => {
    expect(deriveWeightGramsFromSize("0g")).toBeNull();
  });

  it("returns null for negative input '-100g'", () => {
    expect(deriveWeightGramsFromSize("-100g")).toBeNull();
  });

  // ── regression: the original bug ─────────────────────────────────────────
  // Before the fix, all variants defaulted to 500g regardless of size label.
  // Verify that common non-500g sizes now derive the correct weight.
  it("REG: '250g' does not return 500", () => {
    expect(deriveWeightGramsFromSize("250g")).not.toBe(500);
  });

  it("REG: '1kg' does not return 500", () => {
    expect(deriveWeightGramsFromSize("1kg")).not.toBe(500);
  });

  it("REG: '100g' does not return 500", () => {
    expect(deriveWeightGramsFromSize("100g")).not.toBe(500);
  });
});
