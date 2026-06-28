import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { sendEmail } from "@/lib/email";
import { buildInStoreInvoiceEmail } from "@/lib/emails/inStoreInvoice";
import { toNum } from "@/lib/decimal";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const emailTo: string = body.email || order.email || '';

  if (!emailTo) {
    return NextResponse.json({ error: "No email address provided" }, { status: 400 });
  }

  const invoiceNo = order.invoiceNo?.startsWith('NOTE:')
    ? undefined
    : order.invoiceNo ?? undefined;

  const html = buildInStoreInvoiceEmail({
    customerName:  order.customerName ?? 'Customer',
    orderId:       order.id,
    invoiceNo,
    items: order.items.map(i => ({
      title:    i.variant.product.title,
      size:     i.variant.size,
      quantity: i.quantity,
      price:    toNum(i.price),
      gstRate:  toNum(i.gstRate),
    })),
    subtotal:      toNum(order.subtotal),
    taxTotal:      toNum(order.taxTotal),
    total:         toNum(order.total),
    paymentMethod: order.paymentMethod,
    phone:         order.phone,
    createdAt:     order.createdAt,
  });

  const result = await sendEmail({
    to:      emailTo,
    subject: `Your SriLaYa Foods receipt — #${order.id.slice(0, 8).toUpperCase()}`,
    html,
    context: 'in_store_invoice',
  });

  if (!result.success) {
    return NextResponse.json({ error: "Failed to send email", details: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
