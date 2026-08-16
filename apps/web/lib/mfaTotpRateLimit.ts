import { prisma } from "@/lib/db";

export const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function checkMfaRateLimit(userId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.mfaTotpAttempt.count({
    where: {
      userId,
      succeeded: false,
      attemptedAt: { gte: cutoff },
    },
  });
  return count < MAX_FAILS;
}

export async function recordMfaAttempt(userId: string, succeeded: boolean): Promise<void> {
  await prisma.mfaTotpAttempt.create({
    data: { userId, succeeded },
  });
}
