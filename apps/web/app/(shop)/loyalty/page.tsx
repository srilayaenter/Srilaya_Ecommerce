import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LoyaltyClient from "./LoyaltyClient";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const session = await getServerSession(authOptions);

  let prefilled: { balance: number } | null = null;

  if (session?.user?.email) {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { balance: true },
    });
    if (account) {
      prefilled = { balance: account.balance };
    }
  }

  return <LoyaltyClient prefilled={prefilled} isLoggedIn={!!session?.user} />;
}
