import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseBody, NotifyStockSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = await parseBody(request, NotifyStockSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const { email, variantId } = parsed.data;

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
