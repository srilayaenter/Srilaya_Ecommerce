// packages/db/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Pull from environment, not hardcoded string
  const rawPassword = process.env.ADMIN_PASSWORD; 
  
  if (!rawPassword) {
    throw new Error("ADMIN_PASSWORD is not set in your .env file!");
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.user.upsert({
    where: { email: 'admin@srilayafoods.com' },
    update: { password: "RaSa@1500", role: 'admin' },
    create: {
      email: 'admin@srilayafoods.com',
      password: "RaSa@1500",
      role: 'admin',
    },
  });
}