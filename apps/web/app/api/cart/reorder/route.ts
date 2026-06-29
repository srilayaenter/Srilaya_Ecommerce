import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { orderId, contact } = await request.json();
  if (!orderId || !contact) {
    return NextResponse.json({ error: "Order ID and contact required." }, { status: 400 });
  }

  const rawId = (orderId as string).trim().replace(/^#/, "").toLowerCase();
  const c = (contact as string).trim().toLowerCase();

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: { startsWith: rawId } }, { id: rawId }] },
    include: { items: { include: { variant: true } } },
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const emailMatch = order.email?.toLowerCase() === c;
  const phoneMatch = order.phone?.replace(/\D/g, "").endsWith(c.replace(/\D/g, ""));
  if (!emailMatch && !phoneMatch) {
    return NextResponse.json({ error: "Contact details don't match." }, { status: 403 });
  }

  const cookieStore = await cookies();
  let cartId = cookieStore.get("cartId")?.value;

  if (!cartId) {
    const cart = await prisma.cart.create({ data: {} });
    cartId = cart.id;
  }

  // Add each item to cart, skip out-of-stock variants
  for (const item of order.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });
    if (!variant || variant.stock < 1) continue;

    const qty = Math.min(item.quantity, variant.stock);

    const existing = await prisma.cartItem.findFirst({
      where: { cartId, variantId: item.variantId },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + qty, variant.stock) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId,
          variantId: item.variantId,
          quantity:  qty,
          price:   variant.price,
          gstRate: item.gstRate,
        },
      });
    }
  }

  const response = NextResponse.json({ success: true });
  if (!cookieStore.get("cartId")?.value) {
    response.cookies.set("cartId", cartId, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}
