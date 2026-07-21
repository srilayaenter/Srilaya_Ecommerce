import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const KEEP = [
  'avrsrikanth@gmail.com',
  'sysadmin@srilayafoods.com',
  'storemanager1@srilayafoods.com',
  'storemanager2@srilayafoods.com',
  'billing1@srilayafoods.com',
  'billing2@srilayafoods.com',
  'inventory1@srilayafoods.com',
  'inventory2@srilayafoods.com',
];

const toDelete = await prisma.user.findMany({
  where: { email: { notIn: KEEP } },
  select: { email: true, role: true },
});

console.log(`\nRemoving ${toDelete.length} accounts:`);
toDelete.forEach(u => console.log(`  - ${u.email} (${u.role})`));

const result = await prisma.user.deleteMany({ where: { email: { notIn: KEEP } } });
console.log(`\nDeleted ${result.count} users.\n`);
await prisma.$disconnect();
