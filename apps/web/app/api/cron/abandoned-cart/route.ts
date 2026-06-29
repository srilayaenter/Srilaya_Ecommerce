import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildAbandonedCartEmail } from "@/lib/emails/abandonedCart";

const CART_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/cart`
  : "https://srilaya.com/cart";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Carts with an email, not yet reminded, updated more than 2h ago, and still have items
  const carts = await prisma.cart.findMany({
    where: {
      email:         { not: null },
      reminderSentAt: null,
      updatedAt:     { lt: twoHoursAgo },
      items:         { some: {} },
    },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
      },
    },
  });

  let sent = 0;
  for (const cart of carts) {
    if (!cart.email) continue;

    const items = cart.items.map(i => ({
      title:    i.variant.product.title,
      size:     i.variant.size,
      quantity: i.quantity,
    }));

    try {
      await sendEmail({
        to:      cart.email,
        subject: `You left items in your cart — ${items.map(i => i.title).join(", ")}`,
        html:    buildAbandonedCartEmail({ items, cartUrl: CART_URL }),
        context: "abandoned_cart",
      });

      await prisma.cart.update({
        where: { id: cart.id },
        data:  { reminderSentAt: new Date() },
      });
      sent++;
    } catch {
      // Log but continue — don't fail the whole batch
    }
  }

  return NextResponse.json({ success: true, sent, total: carts.length });
}

export async function GET(request: Request) {
  return POST(request);
}
