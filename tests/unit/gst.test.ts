import { describe, it, expect } from "vitest";
import { calcLineGst, calcLineTotal, calcOrderSubtotals, LineItem } from "@/lib/pricing";

// ── calcLineGst ───────────────────────────────────────────────────────────────

describe("calcLineGst", () => {
  it("5% GST on ₹200 × 1 = ₹10", () => {
    expect(calcLineGst(200, 1, 5)).toBe(10);
  });

  it("5% GST on ₹200 × 2 = ₹20", () => {
    expect(calcLineGst(200, 2, 5)).toBe(20);
  });

  it("12% GST on ₹500 × 1 = ₹60", () => {
    expect(calcLineGst(500, 1, 12)).toBe(60);
  });

  it("0% GST (tax-exempt food) = ₹0", () => {
    expect(calcLineGst(300, 3, 0)).toBe(0);
  });

  it("fractional price: 5% on ₹149.50 × 1 = ₹7.475", () => {
    expect(calcLineGst(149.5, 1, 5)).toBeCloseTo(7.475, 5);
  });

  it("qty 0 always gives ₹0", () => {
    expect(calcLineGst(500, 0, 5)).toBe(0);
  });
});

// ── calcLineTotal ─────────────────────────────────────────────────────────────

describe("calcLineTotal", () => {
  it("5% GST: ₹200 × 1 → ₹210", () => {
    expect(calcLineTotal(200, 1, 5)).toBe(210);
  });

  it("5% GST: ₹200 × 2 → ₹420", () => {
    expect(calcLineTotal(200, 2, 5)).toBe(420);
  });

  it("0% GST: line total equals price × qty", () => {
    expect(calcLineTotal(300, 3, 0)).toBe(900);
  });

  it("lineTotal = price*qty + gstAmt", () => {
    const price = 149.5, qty = 2, rate = 5;
    expect(calcLineTotal(price, qty, rate)).toBeCloseTo(
      price * qty + calcLineGst(price, qty, rate),
      10
    );
  });
});

// ── calcOrderSubtotals ────────────────────────────────────────────────────────

describe("calcOrderSubtotals", () => {
  // ── empty cart ────────────────────────────────────────────────────────────
  it("empty cart returns all zeros", () => {
    expect(calcOrderSubtotals([])).toEqual({ subtotal: 0, taxTotal: 0, grandTotal: 0 });
  });

  // ── single item ──────────────────────────────────────────────────────────
  it("single item, 5% GST: subtotal=200, taxTotal=10, grandTotal=210", () => {
    const items: LineItem[] = [{ price: 200, quantity: 1, gstRate: 5 }];
    expect(calcOrderSubtotals(items)).toEqual({ subtotal: 200, taxTotal: 10, grandTotal: 210 });
  });

  it("single item qty 2: subtotal=400, taxTotal=20, grandTotal=420", () => {
    const items: LineItem[] = [{ price: 200, quantity: 2, gstRate: 5 }];
    expect(calcOrderSubtotals(items)).toEqual({ subtotal: 400, taxTotal: 20, grandTotal: 420 });
  });

  it("single item, 0% GST: taxTotal=0, grandTotal=subtotal", () => {
    const items: LineItem[] = [{ price: 300, quantity: 1, gstRate: 0 }];
    const { subtotal, taxTotal, grandTotal } = calcOrderSubtotals(items);
    expect(taxTotal).toBe(0);
    expect(grandTotal).toBe(subtotal);
  });

  // ── multiple items, same rate ─────────────────────────────────────────────
  it("two items at 5%: subtotals and tax aggregate correctly", () => {
    const items: LineItem[] = [
      { price: 200, quantity: 1, gstRate: 5 }, // 200 + 10 gst
      { price: 300, quantity: 2, gstRate: 5 }, // 600 + 30 gst
    ];
    expect(calcOrderSubtotals(items)).toEqual({
      subtotal: 800,
      taxTotal: 40,
      grandTotal: 840,
    });
  });

  // ── mixed GST rates (common in food orders) ────────────────────────────────
  it("mixed rates: 0% staple + 5% processed food", () => {
    const items: LineItem[] = [
      { price: 200, quantity: 1, gstRate: 0 }, // raw grain, tax-exempt
      { price: 300, quantity: 1, gstRate: 5 }, // processed laddu
    ];
    const result = calcOrderSubtotals(items);
    expect(result.subtotal).toBe(500);
    expect(result.taxTotal).toBeCloseTo(15, 10); // only ₹300 attracts GST
    expect(result.grandTotal).toBeCloseTo(515, 10);
  });

  it("mixed rates: 5% and 12%", () => {
    const items: LineItem[] = [
      { price: 500, quantity: 1, gstRate: 5 },  // ₹25 GST
      { price: 500, quantity: 1, gstRate: 12 }, // ₹60 GST
    ];
    const result = calcOrderSubtotals(items);
    expect(result.subtotal).toBe(1000);
    expect(result.taxTotal).toBeCloseTo(85, 10);
    expect(result.grandTotal).toBeCloseTo(1085, 10);
  });

  // ── grand total invariant ─────────────────────────────────────────────────
  it("grandTotal always equals subtotal + taxTotal", () => {
    const items: LineItem[] = [
      { price: 149.5, quantity: 2, gstRate: 5 },
      { price: 399,   quantity: 1, gstRate: 12 },
      { price: 89,    quantity: 3, gstRate: 0 },
    ];
    const { subtotal, taxTotal, grandTotal } = calcOrderSubtotals(items);
    expect(grandTotal).toBeCloseTo(subtotal + taxTotal, 10);
  });

  // ── floating-point prices ─────────────────────────────────────────────────
  it("fractional prices accumulate correctly", () => {
    const items: LineItem[] = [
      { price: 149.5, quantity: 1, gstRate: 5 }, // gst = 7.475
      { price: 99.9,  quantity: 2, gstRate: 5 }, // gst = 9.99
    ];
    const { subtotal, taxTotal } = calcOrderSubtotals(items);
    expect(subtotal).toBeCloseTo(349.3, 5);
    expect(taxTotal).toBeCloseTo(17.465, 5);
  });

  // ── Prisma Decimal coerced to number via toNum ────────────────────────────
  // In production, price and gstRate come from DB as Decimal objects.
  // toNum() is called before passing to these helpers. Verify the helpers
  // handle numbers that were Decimals (represented here as strings to simulate).
  it("works after toNum() coercion — price/rate as parsed numbers", () => {
    // Simulate: toNum(new Prisma.Decimal('200.00')) → 200
    const items: LineItem[] = [{ price: parseFloat("200.00"), quantity: 1, gstRate: parseFloat("5.00") }];
    expect(calcOrderSubtotals(items)).toEqual({ subtotal: 200, taxTotal: 10, grandTotal: 210 });
  });

  // ── typical SriLaYa order ─────────────────────────────────────────────────
  it("realistic order: 500g millet ₹180 + 250g laddu ₹120 × 2, all at 5%", () => {
    const items: LineItem[] = [
      { price: 180, quantity: 1, gstRate: 5 }, // ₹9 GST
      { price: 120, quantity: 2, gstRate: 5 }, // ₹12 GST
    ];
    const { subtotal, taxTotal, grandTotal } = calcOrderSubtotals(items);
    expect(subtotal).toBe(420);
    expect(taxTotal).toBe(21);
    expect(grandTotal).toBe(441);
  });

  // ── shipping is NOT included in grandTotal ────────────────────────────────
  it("grandTotal does not include shipping — caller adds it separately", () => {
    const items: LineItem[] = [{ price: 200, quantity: 1, gstRate: 5 }];
    const { grandTotal } = calcOrderSubtotals(items);
    const shipping = 60;
    // Caller pattern: baseTotal = grandTotal + shippingFee
    expect(grandTotal + shipping).toBe(270);
  });
});
