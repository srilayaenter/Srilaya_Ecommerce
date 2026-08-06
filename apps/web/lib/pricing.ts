/**
 * Pure pricing helpers — no DB, fully unit-testable.
 */

// ── GST helpers ──────────────────────────────────────────────────────────────

export type LineItem = { price: number; quantity: number; gstRate: number };

/** GST amount for one line: price × qty × (rate / 100) */
export function calcLineGst(price: number, quantity: number, gstRate: number): number {
  return (price * quantity * gstRate) / 100;
}

/** Total line value inclusive of GST */
export function calcLineTotal(price: number, quantity: number, gstRate: number): number {
  return price * quantity + calcLineGst(price, quantity, gstRate);
}

/**
 * Aggregates subtotal, taxTotal, and grandTotal from an array of line items.
 * subtotal  — sum of (price × qty) before GST
 * taxTotal  — sum of GST amounts across all lines
 * grandTotal — subtotal + taxTotal (does not include shipping)
 */
export function calcOrderSubtotals(items: LineItem[]): {
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let taxTotal = 0;
  for (const item of items) {
    subtotal += item.price * item.quantity;
    taxTotal += calcLineGst(item.price, item.quantity, item.gstRate);
  }
  return { subtotal, taxTotal, grandTotal: subtotal + taxTotal };
}

// ── Coupon / order-total helpers ─────────────────────────────────────────────

export function calcCouponDiscount(
  baseTotal: number,
  coupon: { type: string; value: { toString(): string } | number | string }
): number {
  if (coupon.type === "percentage") {
    return parseFloat(((baseTotal * Number(coupon.value)) / 100).toFixed(2));
  }
  return Math.min(Number(coupon.value), baseTotal);
}

export function calcOrderTotal(
  baseTotal: number,
  loyaltyDiscount: number,
  couponDiscount: number
): number {
  return Math.max(0, baseTotal - loyaltyDiscount - couponDiscount);
}
