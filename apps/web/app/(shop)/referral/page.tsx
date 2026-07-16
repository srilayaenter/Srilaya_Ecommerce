import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/loyalty";
import ReferralClient from "./ReferralClient";

export default async function ReferralPage() {
  const session = await getServerSession(authOptions);

  let prefilled: { referralCode: string; balance: number; totalEarned: number } | null = null;

  if (session?.user?.email) {
    const email = session.user.email.toLowerCase();
    let account = await prisma.loyaltyAccount.findUnique({
      where: { email },
      select: { referralCode: true, balance: true, totalEarned: true },
    });

    // Auto-assign a referral code if the account exists but has none
    if (account && !account.referralCode) {
      let code = generateReferralCode();
      while (await prisma.loyaltyAccount.findUnique({ where: { referralCode: code } })) {
        code = generateReferralCode();
      }
      account = await prisma.loyaltyAccount.update({
        where: { email },
        data: { referralCode: code },
        select: { referralCode: true, balance: true, totalEarned: true },
      });
    }

    if (account?.referralCode) {
      prefilled = {
        referralCode: account.referralCode,
        balance: account.balance,
        totalEarned: account.totalEarned,
      };
    }
  }

  return <ReferralClient prefilled={prefilled} isLoggedIn={!!session?.user} />;
}
