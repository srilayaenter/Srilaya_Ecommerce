/**
 * Pure pricing helpers — no DB, fully unit-testable.
 */

export function calcCouponDiscount(
  baseTotal: number,
  coupon: { type: string; value: number | string }
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
