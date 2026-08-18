import { PrismaClient } from "../packages/db";

// Backfills Order.courierKey / Order.courierLabel from the legacy
// "COURIER:<key>" values that were previously (incorrectly) smuggled into
// Order.invoiceNo before the Phase 3 schema fix. Only touches rows whose
// invoiceNo matches that exact legacy pattern — genuine invoice numbers are
// never read or modified.
//
// SAFE BY DEFAULT: runs in dry-run/report-only mode unless --apply is passed.
// Reads DATABASE_URL from the environment it's run in — never hardcode or
// paste a connection string here.
//
// Usage (dry run, default — no writes):
//   DATABASE_URL="<...>" npx tsx scripts/backfill-order-courier-snapshot.ts
//
// Usage (apply — writes courierKey/courierLabel, clears invoiceNo on
// affected rows only):
//   DATABASE_URL="<...>" npx tsx scripts/backfill-order-courier-snapshot.ts --apply
//
// Per project convention: run dry-run on staging first, review the report,
// then --apply on staging, and only touch production with separate approval.

import { COURIERS } from "../apps/web/lib/shipping";

const prisma = new PrismaClient();

const LEGACY_COURIER_PATTERN = /^COURIER:(.+)$/;

function resolveLabel(key: string): string | null {
  return COURIERS.find((c) => c.key === key)?.name ?? null;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const candidates = await prisma.order.findMany({
    where: { invoiceNo: { startsWith: "COURIER:" } },
    select: { id: true, invoiceNo: true, courierKey: true, courierLabel: true },
  });

  const affected = candidates.filter((o) => o.invoiceNo && LEGACY_COURIER_PATTERN.test(o.invoiceNo));

  if (affected.length === 0) {
    console.log("No orders found with a legacy COURIER: invoiceNo value. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${affected.length} order(s) with a legacy COURIER: invoiceNo value.\n`);

  const rows = affected.map((o) => {
    const match = o.invoiceNo!.match(LEGACY_COURIER_PATTERN)!;
    const key = match[1];
    const label = resolveLabel(key);
    return {
      id: o.id,
      currentInvoiceNo: o.invoiceNo,
      extractedKey: key,
      resolvedLabel: label ?? "(unrecognized key — will store key only, no label)",
      alreadyHasSnapshot: !!(o.courierKey || o.courierLabel),
    };
  });

  console.table(rows);

  if (!apply) {
    console.log(`\nDry run only — no changes made. Re-run with --apply to write these ${affected.length} row(s).`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\n--apply passed — writing ${affected.length} row(s)...`);

  let updated = 0;
  for (const row of rows) {
    await prisma.order.update({
      where: { id: row.id },
      data: {
        courierKey: row.extractedKey,
        courierLabel: row.resolvedLabel.startsWith("(unrecognized") ? null : row.resolvedLabel,
        invoiceNo: null,
      },
    });
    updated++;
  }

  console.log(`Backfill complete — updated ${updated} order(s).`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
