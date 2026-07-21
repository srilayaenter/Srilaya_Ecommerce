/**
 * Seeds the 7 named role-slot staff accounts.
 * Safe to re-run — skips accounts that already exist.
 *
 * Run against local:   node scripts/seed-staff-accounts.mjs
 * Run against staging: DATABASE_URL="..." node scripts/seed-staff-accounts.mjs
 *
 * Initial passwords — change via Admin → Users → Reset Password after first login.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ACCOUNTS = [
  { email: "sysadmin@srilayafoods.com",      role: "admin",           label: "System Admin",      password: "SriLaYa@Admin1"    },
  { email: "storemanager1@srilayafoods.com",  role: "manager",         label: "Store Manager 1",   password: "SriLaYa@Mgr1"      },
  { email: "storemanager2@srilayafoods.com",  role: "manager",         label: "Store Manager 2",   password: "SriLaYa@Mgr2"      },
  { email: "billing1@srilayafoods.com",       role: "billing_staff",   label: "Billing Staff 1",   password: "SriLaYa@Bill1"     },
  { email: "billing2@srilayafoods.com",       role: "billing_staff",   label: "Billing Staff 2",   password: "SriLaYa@Bill2"     },
  { email: "inventory1@srilayafoods.com",     role: "inventory_staff", label: "Inventory Staff 1", password: "SriLaYa@Inv1"      },
  { email: "inventory2@srilayafoods.com",     role: "inventory_staff", label: "Inventory Staff 2", password: "SriLaYa@Inv2"      },
];

async function main() {
  console.log("\n── SriLaYa Staff Account Seed ──\n");

  for (const acc of ACCOUNTS) {
    const exists = await prisma.user.findUnique({ where: { email: acc.email } });
    if (exists) {
      console.log(`  ⏭  ${acc.label.padEnd(20)} already exists — skipped`);
      continue;
    }
    const hash = await bcrypt.hash(acc.password, 10);
    await prisma.user.create({ data: { email: acc.email, password: hash, role: acc.role } });
    console.log(`  ✓  ${acc.label.padEnd(20)} created  (${acc.email})`);
  }

  console.log("\n── Initial credentials (change after first use) ──\n");
  ACCOUNTS.forEach(a => console.log(`  ${a.label.padEnd(20)} ${a.email.padEnd(38)} ${a.password}`));
  console.log("\nDone.\n");
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
