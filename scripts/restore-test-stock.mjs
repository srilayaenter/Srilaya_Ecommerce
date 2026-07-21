/**
 * The checkout test decremented stock by 1 per variant (154 variants × 1).
 * This restores those decrements by adding 1 back to every active variant.
 * Only run on local DB — staging was never touched by the test script.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const result = await prisma.productVariant.updateMany({
  where: { active: true, product: { active: true } },
  data: { stock: { increment: 1 } },
});

console.log(`\nRestored stock for ${result.count} variants.\n`);
await prisma.$disconnect();
