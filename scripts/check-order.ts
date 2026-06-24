import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { id: { startsWith: 'cmqqggvi' } },
    select: { id: true, status: true, fulfillmentStatus: true, paymentId: true }
  });
  console.log('CMQQGGVI:', order);

  const order2 = await prisma.order.findFirst({
    where: { id: { startsWith: 'cmqqfi51' } },
    select: { id: true, status: true, fulfillmentStatus: true, paymentId: true }
  });
  console.log('CMQQFI51:', order2);
}

main().finally(() => prisma.$disconnect());