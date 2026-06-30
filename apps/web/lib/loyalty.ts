import { prisma } from "@/lib/db";

// 1 point per ₹10 spent; 10 points = ₹1 discount (1% effective cashback)
export const POINTS_PER_RUPEE = 0.1;
export const RUPEES_PER_POINT = 0.1;
export const MIN_REDEEM_POINTS = 100; // ₹10 minimum discount
export const MAX_REDEEM_PCT = 10;     // max 10% of order total

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

export async function getBalance(email: string): Promise<number> {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { email },
    select: { balance: true },
  });
  return account?.balance ?? 0;
}

export async function earnPoints(email: string, orderId: string, orderTotal: number): Promise<void> {
  const points = pointsEarned(orderTotal);
  if (points <= 0) return;
  await prisma.loyaltyAccount.upsert({
    where: { email },
    create: {
      email,
      balance: points,
      totalEarned: points,
      transactions: {
        create: { type: "earned", points, orderId, note: `Order ${orderId.slice(0, 8).toUpperCase()}` },
      },
    },
    update: {
      balance: { increment: points },
      totalEarned: { increment: points },
      transactions: {
        create: { type: "earned", points, orderId, note: `Order ${orderId.slice(0, 8).toUpperCase()}` },
      },
    },
  });
}

export async function redeemPoints(email: string, orderId: string, points: number): Promise<void> {
  await prisma.loyaltyAccount.update({
    where: { email },
    data: {
      balance: { decrement: points },
      transactions: {
        create: {
          type: "redeemed",
          points: -points,
          orderId,
          note: `Redeemed for order ${orderId.slice(0, 8).toUpperCase()}`,
        },
      },
    },
  });
}
