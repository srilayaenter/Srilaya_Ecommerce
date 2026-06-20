import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { sendEmail } from "../../../../lib/email";
import { buildLowStockAlert } from "../../../../lib/emails/adminAlerts";

const LOW_STOCK_THRESHOLD = 10;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.ADMIN_ALERT_EMAIL) {
      return NextResponse.json({ success: true, message: "No admin alert email configured, skipping" });
    }

    const lowStockVariants = await prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD, gt: 0 } },
      include: { product: true },
      orderBy: { stock: 'asc' }
    });

    if (lowStockVariants.length === 0) {
      return NextResponse.json({ success: true, message: "No low stock items" });
    }

    await sendEmail({
      to: process.env.ADMIN_ALERT_EMAIL,
      subject: `Low stock alert — ${lowStockVariants.length} item(s) running low`,
      html: buildLowStockAlert({
        variants: lowStockVariants.map(v => ({
          productTitle: v.product.title,
          size: v.size,
          stock: v.stock,
          sku: v.sku,
        }))
      }),
      context: 'admin_alert_low_stock',
    });

    return NextResponse.json({
      success: true,
      itemsFlagged: lowStockVariants.length
    });

  } catch (error: any) {
    console.error("Low stock check error:", error);
    return NextResponse.json(
      { error: "Low stock check failed", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}