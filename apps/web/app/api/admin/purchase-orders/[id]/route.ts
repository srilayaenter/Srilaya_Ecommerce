import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { logStockChanges, type StockLogEntry } from "@/lib/stockLog";
import { adminRateLimit } from "@/lib/adminGuard";

async function guard() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && isAdminRole(session.user.role) ? session.user : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const session = await getServerSession(authOptions);
  const rl = adminRateLimit((session!.user as any).id ?? (session!.user as any).email ?? "unknown");
  if (rl) return rl;
  const { id } = await params;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, items: true },
  });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ po });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await guard();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const rl = adminRateLimit((user as any).id ?? (user as any).email ?? "unknown");
  if (rl) return rl;
  const { id } = await params;

  const body = await request.json();
  const { action, receivedItems, status, note } = body;

  if (action === "receive") {
    // receivedItems: [{ poItemId, quantityReceived }]
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const stockLogEntries: StockLogEntry[] = [];

    for (const rec of (receivedItems as { poItemId: string; quantityReceived: number }[])) {
      const poItem = po.items.find(i => i.id === rec.poItemId);
      if (!poItem || rec.quantityReceived <= 0) continue;

      const newReceived = poItem.quantityReceived + rec.quantityReceived;
      await prisma.purchaseOrderItem.update({
        where: { id: rec.poItemId },
        data:  { quantityReceived: newReceived },
      });

      await prisma.productVariant.update({
        where: { id: poItem.variantId },
        data:  { stock: { increment: rec.quantityReceived } },
      });

      stockLogEntries.push({
        variantId: poItem.variantId,
        sku:       poItem.sku,
        delta:     rec.quantityReceived,
        reason:    "po_receive" as const,
        note:      `PO:${id}`,
      });
    }

    // Determine new PO status
    const updatedItems = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
    const allReceived  = updatedItems.every(i => i.quantityReceived >= i.quantityOrdered);
    const anyReceived  = updatedItems.some(i => i.quantityReceived > 0);
    const newStatus    = allReceived ? "received" : anyReceived ? "partial" : po.status;

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data:  { status: newStatus, receivedAt: allReceived ? new Date() : undefined },
      include: { items: true, supplier: true },
    });

    logStockChanges(stockLogEntries).catch(() => {});
    return NextResponse.json({ po: updated });
  }

  // Generic status / note update
  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(note   !== undefined ? { note } : {}),
    },
    include: { items: true, supplier: true },
  });
  return NextResponse.json({ po: updated });
}
