import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST — accepts CSV text body
// Expected columns (header row required):
//   sku, stock, price, reorderThreshold
// Only updates variants that exist by SKU; skips unknowns.

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager", "inventory_staff"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

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
  const stockNotifyIds: string[] = [];

  for (const row of rows) {
    const variant = variantMap[row.sku];
    if (!variant) { notFound.push(row.sku); skipped++; continue; }

    const data: any = { stock: row.stock };
    if (row.price !== null && !isNaN(row.price))            data.price = row.price;
    if (row.reorderThreshold !== null && !isNaN(row.reorderThreshold)) data.reorderThreshold = row.reorderThreshold;

    await prisma.productVariant.update({ where: { id: variant.id }, data });

    // Track variants that went from 0 → positive for stock notifications
    if (variant.stock === 0 && row.stock > 0) stockNotifyIds.push(variant.id);
    updated++;
  }

  // Fire stock notifications asynchronously
  if (stockNotifyIds.length > 0) {
    import("@/lib/stockNotifications").then(({ sendStockNotifications }) => {
      stockNotifyIds.forEach(id => sendStockNotifications(id).catch(() => {}));
    });
  }

  return NextResponse.json({ updated, skipped, notFound });
}
