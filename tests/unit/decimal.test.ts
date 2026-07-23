import { describe, it, expect } from "vitest";
import { toNum } from "../../apps/web/lib/decimal";

describe("toNum", () => {
  it("passes through a number unchanged", () => {
    expect(toNum(42)).toBe(42);
    expect(toNum(0)).toBe(0);
    expect(toNum(-5)).toBe(-5);
  });

  it("parses a numeric string", () => {
    expect(toNum("123.45")).toBe(123.45);
    expect(toNum("0")).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(toNum(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(toNum(undefined)).toBe(0);
  });

  it("parses Prisma Decimal objects (toString)", () => {
    const decimal = { toString: () => "99.99" };
    expect(toNum(decimal)).toBe(99.99);
  });

  it("returns NaN for non-numeric strings", () => {
    expect(toNum("abc")).toBeNaN();
  });
});
