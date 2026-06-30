import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/brand";
import { parseBody, CancelOrderSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, CancelOrderSchema);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const { orderId, email } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.email?.toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json({ error: "Email does not match this order" }, { status: 403 });
    }

    if (order.status !== "pending" && order.status !== "paid") {
      return NextResponse.json({ error: "This order cannot be cancelled" }, { status: 400 });
    }

    if (order.fulfillmentStatus !== "pending") {
      return NextResponse.json({ error: "Order has already been dispatched and cannot be cancelled" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: "cancelled", fulfillmentStatus: "cancelled" },
      });
    });

    // Send cancellation confirmation
    if (order.email) {
      const shortId = order.id.slice(0, 8).toUpperCase();
      await sendEmail({
        to: order.email,
        subject: `Order #${shortId} Cancelled | ${BRAND.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#006A38;padding:24px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:22px;">${BRAND.name}</h1>
            </div>
            <div style="padding:28px 32px;">
              <h2 style="color:#212121;margin:0 0 12px;">Order Cancelled</h2>
              <p style="color:#555;font-size:14px;">
                Hi ${order.customerName || "there"},<br/><br/>
                Your order <strong>#${shortId}</strong> has been successfully cancelled.
              </p>
              <p style="color:#555;font-size:14px;">
                If you paid online, your refund will be processed within 5–7 business days back to your original payment method.
                For any questions, contact us at <a href="mailto:${BRAND.email}" style="color:#006A38;">${BRAND.email}</a>.
              </p>
            </div>
            <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#999;">
              ${BRAND.name} | ${BRAND.phone}
            </div>
          </div>
        `,
        context: `order_cancelled:${orderId}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
