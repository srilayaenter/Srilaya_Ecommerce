import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Runs daily via Vercel cron — deletes MfaTotpAttempt records older than 30 days.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.mfaTotpAttempt.deleteMany({
    where: { attemptedAt: { lt: cutoff } },
  });

  return NextResponse.json({ deleted: count });
}
