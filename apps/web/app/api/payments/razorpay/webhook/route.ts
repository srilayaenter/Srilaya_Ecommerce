import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { buildPaymentFailedAlert } from "@/lib/emails/adminAlerts";
import { sendStockNotifications } from "@/lib/stockNotifications";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";
import { log, logPaymentFailed, logError } from "@/lib/logger";
import { logPaymentEvent } from "@/lib/paymentAudit";

export async function POST(request: Request) {
  let rawBody = "";
  try {
    rawBody = await request.text();
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

    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const signatureBuf = Buffer.from(signature, 'hex');
    if (
      expectedBuf.length !== signatureBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, signatureBuf)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.id || `${event.event}_${Date.now()}`;

    // The WebhookEvent insert is committed in the SAME transaction as the
    // state change it's guarding, not claimed upfront — that keeps a
    // concurrent duplicate delivery from double-running the side effects
    // below (the unique constraint on eventId makes the second transaction
    // fail atomically), while still letting a genuinely failed attempt be
    // retried later (by Razorpay or the admin "replay" button) instead of
    // being silently marked "processed" before it actually succeeded.
    let eventClaimed = false;

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const paymentId = payment.id;

      const order = await prisma.order.findFirst({
        where: { paymentId: razorpayOrderId }
      });

      if (order && order.status !== 'paid') {
        try {
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'paid',
                paymentId: paymentId,
                invoiceNo: order.invoiceNo || `INV-${Date.now()}`,
              }
            }),
            // Webhook has no request cookies, so it clears the cart via the
            // cartId snapshotted on the order at creation time. This is the
            // only cart-clearing path for a payment confirmed solely by
            // webhook (client never reached /verify). Harmless no-op if the
            // cart was already cleared by verify. See
            // docs/proposal-1a-order-cart-linkage-2026-08-19.md.
            ...(order.cartId
              ? [prisma.cartItem.deleteMany({ where: { cartId: order.cartId } })]
              : []),
            prisma.webhookEvent.create({ data: { provider: 'razorpay', eventId } }),
          ]);
          eventClaimed = true;
          await logPaymentEvent({
            eventType: "payment.captured_webhook",
            status: "success",
            orderId: order.id,
            razorpayOrderId,
            razorpayPaymentId: paymentId,
            amount: toNum(order.total),
            userId: order.userId ?? undefined,
          });
        } catch (e: any) {
          if (e.code === "P2002") {
            return NextResponse.json({ success: true, message: "Already processed" });
          }
          throw e;
        }
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

        try {
          await prisma.$transaction([
            ...orderItems.map(item =>
              prisma.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } }
              })
            ),
            prisma.order.update({
              where: { id: order.id },
              data: { status: 'failed' }
            }),
            prisma.webhookEvent.create({ data: { provider: 'razorpay', eventId } }),
          ]);
          eventClaimed = true;
          await logPaymentEvent({
            eventType: "payment.failed_webhook",
            status: "failed",
            orderId: order.id,
            razorpayOrderId,
            amount: toNum(order.total),
            userId: order.userId ?? undefined,
          });
        } catch (e: any) {
          if (e.code === "P2002") {
            return NextResponse.json({ success: true, message: "Already processed" });
          }
          throw e;
        }

        // Fire stock notifications asynchronously now that stock is restored
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

    // Event types we don't act on, or cases where the state guard above
    // already skipped processing (e.g. already paid) — still record the
    // eventId once so repeated deliveries short-circuit cheaply next time.
    if (!eventClaimed) {
      try {
        await prisma.webhookEvent.create({ data: { provider: 'razorpay', eventId } });
      } catch (e: any) {
        if (e.code !== "P2002") throw e;
      }
    }

    await log.flush();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    logError("payment.webhook", error);
    await log.flush();
    // Save to FailedWebhook so it can be reviewed and retried from the admin panel
    try {
      await prisma.failedWebhook.create({
        data: {
          provider:     "razorpay",
          eventId:      (error as any)?._eventId ?? null,
          rawBody:      rawBody ?? "",
          errorMessage: error?.message ?? String(error),
        },
      });
    } catch { /* don't mask the original error */ }
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}