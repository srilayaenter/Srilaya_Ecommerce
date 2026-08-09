/**
 * Safe production migration runner.
 * Requires explicit --confirm flag to prevent accidents.
 *
 * Usage: node scripts/migrate-prod.mjs --confirm
 */
import { execSync } from "child_process";

const confirmed = process.argv.includes("--confirm");

if (!confirmed) {
  console.error("\n🚨  PRODUCTION MIGRATION GUARD\n");
  console.error("   This script applies migrations to the PRODUCTION Supabase DB.");
  console.error("   Only run this after merging staging → main.\n");
  console.error("   To proceed: node scripts/migrate-prod.mjs --confirm\n");
  process.exit(1);
}

const PROD_DIRECT_URL = "postgresql://postgres:jGj0pFRgE0bRuzaq@db.szsrdtiphbdpdfggxwpw.supabase.co:5432/postgres";

console.log("\n⚡ Applying migrations to PRODUCTION DB...\n");

execSync(`npx prisma migrate deploy`, {
  cwd: "packages/db",
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: PROD_DIRECT_URL,
    DIRECT_URL:   PROD_DIRECT_URL,
  },
});

console.log("\n✅ Production migration complete.\n");
