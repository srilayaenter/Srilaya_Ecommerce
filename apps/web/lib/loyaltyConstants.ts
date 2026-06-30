export const POINTS_PER_RUPEE = 0.1;  // 1 point per ₹10
export const RUPEES_PER_POINT = 0.1;  // 10 points = ₹1
export const MIN_REDEEM_POINTS = 100;
export const MAX_REDEEM_PCT    = 10;
export const REFERRAL_BONUS    = 50;

export function pointsToRupees(points: number): number {
  return parseFloat((points * RUPEES_PER_POINT).toFixed(2));
}

export function maxRedeemablePoints(orderTotal: number, balance: number): number {
  const maxFromOrder = Math.floor((orderTotal * MAX_REDEEM_PCT) / 100 / RUPEES_PER_POINT);
  return Math.min(balance, maxFromOrder);
}
