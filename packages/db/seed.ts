import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@srilayafoods.com';
  const plainPassword = 'admin123'; // The password you are typing
  
  // Use 10 rounds, just like we will in auth.ts
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: 'admin' },
    create: {
      email,
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('Admin user updated with new hash.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });