import { prisma } from "./db";

type Reason = "order" | "offline_order" | "return_restock" | "csv_import" | "manual_edit" | "po_receive";

interface StockLogEntry {
  variantId: string;
  sku: string;
  delta: number;
  reason: Reason;
  note?: string;
  userId?: string;
}

export async function logStockChange(entry: StockLogEntry) {
  await prisma.stockLog.create({ data: entry }).catch(() => {});
}

export async function logStockChanges(entries: StockLogEntry[]) {
  if (!entries.length) return;
  await prisma.stockLog.createMany({ data: entries }).catch(() => {});
}
