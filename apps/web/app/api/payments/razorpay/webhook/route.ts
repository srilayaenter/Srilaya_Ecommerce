import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { buildPaymentFailedAlert } from "@/lib/emails/adminAlerts";
import { sendStockNotifications } from "@/lib/stockNotifications";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";
import { log, logPaymentFailed, logError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.id || `${event.event}_${Date.now()}`;

    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const paymentId = payment.id;

      const order = await prisma.order.findFirst({
        where: { paymentId: razorpayOrderId }
      });

      if (order && order.status !== 'paid') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'paid',
            paymentId: paymentId,
            invoiceNo: order.invoiceNo || `INV-${Date.now()}`,
          }
        });
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const order = await prisma.order.findFirst({
        where: { paymentId: razorpayOrderId }
      });

      if (order && order.status === 'pending') {
        logPaymentFailed({
          orderId: order.id,
          razorpayOrderId,
          reason: "payment.failed_webhook",
          email: order.email ?? undefined,
          total: toNum(order.total),
        });

        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: order.id }
        });

        await prisma.$transaction(async (tx) => {
          for (const item of orderItems) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } }
            });
          }
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'failed' }
          });
        });

        // Fire stock notifications asynchronously after stock is restored
        orderItems.forEach(item => sendStockNotifications(item.variantId).catch(() => {}));

        if (process.env.ADMIN_ALERT_EMAIL) {
          await sendEmail({
            to: process.env.ADMIN_ALERT_EMAIL,
            subject: `Payment failed — Order ${order.id.slice(0, 8).toUpperCase()}`,
            html: buildPaymentFailedAlert({
              orderId: order.id,
              customerName: order.customerName || '',
              customerEmail: order.email || '',
              total: toNum(order.total),
            }),
            context: `admin_alert_payment_failed:${order.id}`,
          });
        }
      }
    }

    await prisma.webhookEvent.create({
      data: { provider: 'razorpay', eventId }
    });

    await log.flush();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    logError("payment.webhook", error);
    await log.flush();
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}