import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { sendEmail } from "../../../../lib/email";
import { buildOrderExpiredEmail } from "../../../../lib/emails/orderExpired";
import { toNum } from "../../../../lib/decimal";

const ABANDONED_AFTER_MINUTES = 30;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - ABANDONED_AFTER_MINUTES * 60 * 1000);

    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: 'pending',
        createdAt: { lt: cutoff },
      },
      include: {
        items: {
          include: { variant: { include: { product: true } } }
        }
      },
    });

    let releasedCount = 0;
    let skippedCount = 0;
    let emailFailures = 0;

    for (const order of abandonedOrders) {
      let didRelease = false;

      try {
        await prisma.$transaction(async (tx) => {
          const stillPending = await tx.order.updateMany({
            where: { id: order.id, status: 'pending' },
            data: { status: 'expired' },
          });

          if (stillPending.count === 0) {
            skippedCount++;
            return;
          }

          for (const item of order.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }

          releasedCount++;
          didRelease = true;
        });
      } catch (err) {
        console.error(`Failed to release stock for order ${order.id}:`, err);
        continue;
      }

      if (didRelease && order.email) {
        const { html } = buildOrderExpiredEmail({
          customerName: order.customerName || '',
          orderId: order.id,
          items: order.items.map(item => ({
            title: item.variant.product.title,
            size: item.variant.size,
            quantity: item.quantity,
          })),
          total: toNum(order.total),
        });

        const emailResult = await sendEmail({
          to: order.email,
          subject: `Your order ${order.id.slice(0, 8).toUpperCase()} wasn't completed`,
          html,
          context: `order_expired:${order.id}`,
        });

        if (!emailResult.success) {
          emailFailures++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: abandonedOrders.length,
      released: releasedCount,
      skipped: skippedCount,
      emailFailures,
    });

  } catch (error: any) {
    console.error("Release-stock cron error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}