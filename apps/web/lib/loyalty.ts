import { prisma } from "@/lib/db";
export { POINTS_PER_RUPEE, RUPEES_PER_POINT, MIN_REDEEM_POINTS, MAX_REDEEM_PCT, REFERRAL_BONUS } from "@/lib/loyaltyConstants";
export { generateReferralCode, pointsEarned, pointsToRupees, maxRedeemablePoints } from "@/lib/loyaltyMath";
import { REFERRAL_BONUS } from "@/lib/loyaltyConstants";
import { generateReferralCode, pointsEarned } from "@/lib/loyaltyMath";

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
  const code = generateReferralCode();
  await prisma.loyaltyAccount.upsert({
    where: { email },
    create: {
      email,
      balance: points,
      totalEarned: points,
      referralCode: code,
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

export async function processReferral(
  newCustomerEmail: string,
  referralCode: string,
  orderId: string
): Promise<void> {
  // Only applies on first paid order
  const prevOrders = await prisma.order.count({
    where: { email: newCustomerEmail, status: "paid", id: { not: orderId } },
  });
  if (prevOrders > 0) return;

  // Find referrer account by code
  const referrer = await prisma.loyaltyAccount.findUnique({
    where: { referralCode },
    select: { id: true, email: true },
  });
  if (!referrer || referrer.email === newCustomerEmail) return;

  // Give referrer 50 points
  await prisma.loyaltyAccount.update({
    where: { id: referrer.id },
    data: {
      balance: { increment: REFERRAL_BONUS },
      totalEarned: { increment: REFERRAL_BONUS },
      transactions: {
        create: { type: "earned", points: REFERRAL_BONUS, orderId, note: `Referral bonus — ${newCustomerEmail}` },
      },
    },
  });

  // Give new customer 50 bonus points (upsert in case account doesn't exist yet)
  const code = generateReferralCode();
  await prisma.loyaltyAccount.upsert({
    where: { email: newCustomerEmail },
    create: {
      email: newCustomerEmail,
      balance: REFERRAL_BONUS,
      totalEarned: REFERRAL_BONUS,
      referralCode: code,
      transactions: {
        create: { type: "earned", points: REFERRAL_BONUS, orderId, note: `Welcome bonus — referred by ${referrer.email}` },
      },
    },
    update: {
      balance: { increment: REFERRAL_BONUS },
      totalEarned: { increment: REFERRAL_BONUS },
      transactions: {
        create: { type: "earned", points: REFERRAL_BONUS, orderId, note: `Welcome bonus — referred by ${referrer.email}` },
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
