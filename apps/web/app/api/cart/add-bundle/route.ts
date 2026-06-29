import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { bundleSlug } = await request.json();
  if (!bundleSlug) return NextResponse.json({ error: "bundleSlug required" }, { status: 400 });

  const bundle = await prisma.bundle.findUnique({
    where: { slug: bundleSlug, active: true },
    include: { items: { include: { variant: true } } },
  });
  if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

  const cookieStore = await cookies();
  let cartId = cookieStore.get("cartId")?.value;
  if (!cartId) {
    const cart = await prisma.cart.create({ data: {} });
    cartId = cart.id;
  }

  // Each bundle item is added as an individual cart item at its variant price
  for (const item of bundle.items) {
    const variant = item.variant;
    if (variant.stock < item.quantity) continue;

    const existing = await prisma.cartItem.findFirst({
      where: { cartId, variantId: item.variantId },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + item.quantity, variant.stock) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: variant.price,
          gstRate: 5, // default GST
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
