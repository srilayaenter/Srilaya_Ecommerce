import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TEST_EMAIL = "test@srilayafoods.com";

const orders = await prisma.order.findMany({
  where: { email: TEST_EMAIL },
  select: { id: true, invoiceNo: true },
});

console.log(`\nFound ${orders.length} test orders to delete.`);

// Delete items first (FK constraint), then orders
const ids = orders.map(o => o.id);
const items = await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
const deleted = await prisma.order.deleteMany({ where: { id: { in: ids } } });

console.log(`Deleted ${items.count} order items and ${deleted.count} orders.\n`);
await prisma.$disconnect();
