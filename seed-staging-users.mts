/**
 * Seed staging DB with test users needed for E2E tests.
 *
 * Usage (run from repo root):
 *   DATABASE_URL="<direct-supabase-url>" npx tsx seed-staging-users.mts
 *
 * Direct URL format (port 5432, no pgbouncer):
 *   postgresql://postgres.<project-ref>:<password>@db.<project-ref>.supabase.co:5432/postgres
 *
 * Users created:
 *   owner  — avrsrikanth@gmail.com  (role: owner)
 *   admin  — admin@srilayafoods.com (role: admin)  ← skip if already exists
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS = [
  {
    email: "avrsrikanth@gmail.com",
    password: process.env.OWNER_PASSWORD ?? "RaSa@1500",
    role: "owner",
  },
  {
    email: "admin@srilayafoods.com",
    password: process.env.ADMIN_PASSWORD ?? "admin123",
    role: "admin",
  },
];

async function main() {
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 12);
    const existing = await prisma.user.findUnique({ where: { email: u.email } });

    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { password: hash, role: u.role },
      });
      console.log(`Updated  ${u.email}  (role: ${u.role})`);
    } else {
      await prisma.user.create({
        data: { email: u.email, password: hash, role: u.role },
      });
      console.log(`Created  ${u.email}  (role: ${u.role})`);
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
