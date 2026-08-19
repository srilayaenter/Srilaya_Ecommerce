import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logStockChanges } from "@/lib/stockLog";
import { adminRateLimit } from "@/lib/adminGuard";

// POST — accepts CSV text body
// Expected columns (header row required):
//   sku, stock, price, reorderThreshold
// Only updates variants that exist by SKU; skips unknowns.
//
// Concurrency: `stock` is an ABSOLUTE target value (not a delta), unchanged
// from the original format. Each row's write is optimistically locked against
// the same stock snapshot already fetched for lookup — if a variant's stock
// changed after the snapshot (e.g. a concurrent order decrement), the row is
// rejected as "conflicted" rather than silently overwriting the newer value.
// Import is per-row independent, not all-or-nothing: one conflicted or
// unknown-SKU row never aborts or rolls back any other row in the same file.

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["owner", "admin", "manager", "inventory_staff"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit((session.user as any).id ?? (session.user as any).email ?? "unknown");
  if (rl) return rl;

  const text = await request.text();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must have a header row and at least one data row." }, { status: 400 });
  }

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const skuIdx   = headers.indexOf("sku");
  const stockIdx = headers.indexOf("stock");
  const priceIdx = headers.indexOf("price");
  const reorderIdx = headers.indexOf("reorderthreshold");

  if (skuIdx === -1 || stockIdx === -1) {
    return NextResponse.json({ error: "CSV must have at least 'sku' and 'stock' columns." }, { status: 400 });
  }

  const rows = lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    return {
      sku:              cols[skuIdx]   ?? "",
      stock:            parseInt(cols[stockIdx] ?? "", 10),
      price:            priceIdx   !== -1 ? parseFloat(cols[priceIdx]   ?? "") : null,
      reorderThreshold: reorderIdx !== -1 ? parseInt(cols[reorderIdx]   ?? "", 10) : null,
    };
  }).filter(r => r.sku && !isNaN(r.stock));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found in CSV." }, { status: 400 });
  }

  const skus = rows.map(r => r.sku);
  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { id: true, sku: true, stock: true },
  });
  const variantMap = Object.fromEntries(variants.map(v => [v.sku, v]));

  let updated = 0;
  let skipped = 0;
  const notFound: string[] = [];
  // A row is "conflicted" when the variant's stock changed between the
  // findMany snapshot above and this row's write attempt (e.g. a customer
  // order decremented it concurrently). The CSV's `stock` column is an
  // ABSOLUTE target value, not a delta — this format is unchanged and is
  // intentional (supports a stock-take/reconciliation workflow) — so an
  // unconditional overwrite here would silently undo the order's decrement.
  // The optimistic-lock guard below uses the SAME snapshot already fetched
  // for variantMap as the expected current value; if the row's conditional
  // update matches zero rows, the value changed underneath us and the row
  // is rejected rather than blindly applied.
  //
  // Import remains PER-ROW INDEPENDENT, not all-or-nothing across the file
  // — this matches the existing behavior for `notFound` rows (one bad/stale
  // row never aborts or rolls back any other row) and is intentionally
  // preserved, not changed, by this fix.
  const conflicted: string[] = [];
  const stockNotifyIds: string[] = [];

  for (const row of rows) {
    const variant = variantMap[row.sku];
    if (!variant) { notFound.push(row.sku); skipped++; continue; }

    const data: any = { stock: row.stock };
    if (row.price !== null && !isNaN(row.price))            data.price = row.price;
    if (row.reorderThreshold !== null && !isNaN(row.reorderThreshold)) data.reorderThreshold = row.reorderThreshold;

    const result = await prisma.productVariant.updateMany({
      where: { id: variant.id, stock: variant.stock },
      data,
    });

    if (result.count === 0) {
      // Stock changed since the snapshot was taken — do not overwrite a
      // newer value. Skip this row entirely (stock, price, and
      // reorderThreshold together) rather than partially applying it.
      conflicted.push(row.sku);
      skipped++;
      continue;
    }

    // Track variants that went from 0 → positive for stock notifications
    if (variant.stock === 0 && row.stock > 0) stockNotifyIds.push(variant.id);
    updated++;
  }

  // Log stock changes from CSV import — only for rows that actually applied.
  const conflictedSet = new Set(conflicted);
  const logEntries = rows
    .filter(r => variantMap[r.sku] && !conflictedSet.has(r.sku))
    .map(r => {
      const v = variantMap[r.sku];
      return { variantId: v.id, sku: r.sku, delta: r.stock - v.stock, reason: "csv_import" as const, note: "CSV batch" };
    })
    .filter(e => e.delta !== 0);
  logStockChanges(logEntries).catch(() => {});

  // Fire stock notifications asynchronously
  if (stockNotifyIds.length > 0) {
    import("@/lib/stockNotifications").then(({ sendStockNotifications }) => {
      stockNotifyIds.forEach(id => sendStockNotifications(id).catch(() => {}));
    });
  }

  return NextResponse.json({ updated, skipped, notFound, conflicted });
}
