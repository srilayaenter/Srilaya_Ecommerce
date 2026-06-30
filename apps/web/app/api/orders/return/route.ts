import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/brand";
import { parseBody, ReturnRequestSchema } from "@/lib/validation";

const RETURN_WINDOW_DAYS = 7;

export async function POST(request: Request) {
  const parsed = await parseBody(request, ReturnRequestSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const { orderId, contact, reason, items } = parsed.data;

  const rawId  = orderId.trim().replace(/^#/, "").toLowerCase();
  const c      = contact.trim().toLowerCase();

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: { startsWith: rawId } }, { id: rawId }] },
    include: { items: { include: { variant: { include: { product: true } } } }, returns: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const emailMatch = order.email?.toLowerCase() === c;
  const phoneMatch = order.phone?.replace(/\D/g, "").endsWith(c.replace(/\D/g, ""));
  if (!emailMatch && !phoneMatch) return NextResponse.json({ error: "Contact details don't match." }, { status: 403 });

  if (order.fulfillmentStatus !== "completed") {
    return NextResponse.json({ error: "Returns can only be requested for delivered orders." }, { status: 400 });
  }

  const daysSinceDelivery = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    return NextResponse.json({ error: `Return window of ${RETURN_WINDOW_DAYS} days has passed.` }, { status: 400 });
  }

  if (order.returns.some(r => r.status === "requested" || r.status === "approved")) {
    return NextResponse.json({ error: "A return request already exists for this order." }, { status: 409 });
  }

  const returnRequest = await prisma.return.create({
    data: {
      orderId: order.id,
      reason,
      items: {
        create: items.map((i) => ({
          variantId: i.variantId,
          title:     i.title,
          size:      i.size,
          quantity:  i.quantity,
        })),
      },
    },
  });

  // Notify admin
  if (process.env.ADMIN_ALERT_EMAIL) {
    sendEmail({
      to: process.env.ADMIN_ALERT_EMAIL,
      subject: `Return request — Order #${order.id.slice(0, 8).toUpperCase()}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;">
        <h2 style="color:#D97706;">↩️ Return Request</h2>
        <p>Order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> from <strong>${order.customerName}</strong> (${order.email})</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Items:</strong></p>
        <ul>${items.map((i: any) => `<li>${i.title} (${i.size}) × ${i.quantity}</li>`).join("")}</ul>
        <p><a href="${process.env.NEXTAUTH_URL ?? ""}/admin/returns">Review in Admin →</a></p>
      </div>`,
      context: `return:${returnRequest.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, returnId: returnRequest.id });
}
