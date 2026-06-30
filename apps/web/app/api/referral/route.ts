import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/loyalty";

// GET /api/referral?email=xxx — get or create referral code for a customer
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  let account = await prisma.loyaltyAccount.findUnique({
    where: { email },
    select: { referralCode: true, balance: true, totalEarned: true },
  });

  // If account exists but has no referral code, assign one
  if (account && !account.referralCode) {
    let code = generateReferralCode();
    // Retry on collision (extremely unlikely)
    while (await prisma.loyaltyAccount.findUnique({ where: { referralCode: code } })) {
      code = generateReferralCode();
    }
    account = await prisma.loyaltyAccount.update({
      where: { email },
      data: { referralCode: code },
      select: { referralCode: true, balance: true, totalEarned: true },
    });
  }

  if (!account) {
    return NextResponse.json({ referralCode: null, balance: 0, totalEarned: 0 });
  }

  return NextResponse.json({
    referralCode: account.referralCode,
    balance: account.balance,
    totalEarned: account.totalEarned,
  });
}
