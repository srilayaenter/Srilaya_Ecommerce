import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { email, variantId } = await request.json();
  if (!email || !variantId) {
    return NextResponse.json({ error: "email and variantId required." }, { status: 400 });
  }

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  if (variant.stock > 0) return NextResponse.json({ error: "Item is already in stock." }, { status: 400 });

  await prisma.stockNotification.upsert({
    where:  { email_variantId: { email: email.toLowerCase(), variantId } },
    create: { email: email.toLowerCase(), variantId },
    update: { notifiedAt: null }, // re-subscribe if they were already notified
  });

  return NextResponse.json({ success: true });
}
