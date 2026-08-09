import { randomBytes } from "crypto";
import { POINTS_PER_RUPEE, RUPEES_PER_POINT, MAX_REDEEM_PCT } from "@/lib/loyaltyConstants";

export function generateReferralCode(): string {
  return "SL-" + randomBytes(3).toString("hex").toUpperCase();
}

export function pointsEarned(orderTotal: number): number {
  return Math.floor(orderTotal * POINTS_PER_RUPEE);
}

export function pointsToRupees(points: number): number {
  return parseFloat((points * RUPEES_PER_POINT).toFixed(2));
}

export function maxRedeemablePoints(orderTotal: number, balance: number): number {
  const maxFromOrder = Math.floor((orderTotal * MAX_REDEEM_PCT) / 100 / RUPEES_PER_POINT);
  return Math.min(balance, maxFromOrder);
}
