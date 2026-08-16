import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { sendEmail } from "@/lib/email";
import { logStockChanges } from "@/lib/stockLog";
import { adminRateLimit } from "@/lib/adminGuard";

async function guard() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && isAdminRole(session.user.role);
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const session = await getServerSession(authOptions);
  const rl = adminRateLimit((session!.user as any).id ?? (session!.user as any).email ?? "unknown");
  if (rl) return rl;
  const returns = await prisma.return.findMany({
    include: {
      order: { select: { id: true, customerName: true, email: true, phone: true, total: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ returns });
}

export async function PATCH(request: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const session = await getServerSession(authOptions);
  const rl = adminRateLimit((session!.user as any).id ?? (session!.user as any).email ?? "unknown");
  if (rl) return rl;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { returnId, status, adminNote } = body;

  const updated = await prisma.return.update({
    where: { id: returnId },
    data: { status, adminNote: adminNote ?? undefined },
    include: { order: true, items: { include: { return: false } } },
  });

  // Restock inventory when return is marked as received
  if (status === "received") {
    const variantIds = updated.items.map(i => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, sku: true },
    });
    const variantMap = Object.fromEntries(variants.map(v => [v.id, v]));

    await Promise.all(updated.items.map(item =>
      prisma.productVariant.update({
        where: { id: item.variantId },
        data:  { stock: { increment: item.quantity } },
      })
    ));

    logStockChanges(updated.items.map(item => ({
      variantId: item.variantId,
      sku:       variantMap[item.variantId]?.sku ?? item.variantId,
      delta:     item.quantity,
      reason:    "return_restock" as const,
      note:      returnId,
    }))).catch(() => {});
  }

  // Notify customer
  const email = updated.order.email;
  if (email) {
    const label = status === "approved" ? "✅ Approved" : status === "rejected" ? "❌ Rejected" : status === "received" ? "📦 Received" : "💰 Refunded";
    const msg = status === "approved"
      ? "Your return has been approved. We will arrange pickup or provide refund instructions shortly."
      : status === "rejected"
      ? `Your return request was not approved. ${adminNote ? `Reason: ${adminNote}` : ""}`
      : status === "received"
      ? "We have received your returned items. Your refund will be processed shortly."
      : "Your refund has been processed. Please allow 5–7 business days for it to reflect.";

    sendEmail({
      to: email,
      subject: `Return ${label} — Order #${updated.order.id.slice(0, 8).toUpperCase()}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;">
        <h2>Return Request Update</h2>
        <p>Hi ${updated.order.customerName},</p>
        <p>${msg}</p>
        ${adminNote && status !== "rejected" ? `<p><em>${adminNote}</em></p>` : ""}
        <p>Order: <strong>#${updated.order.id.slice(0, 8).toUpperCase()}</strong></p>
      </div>`,
      context: `return_update:${returnId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
