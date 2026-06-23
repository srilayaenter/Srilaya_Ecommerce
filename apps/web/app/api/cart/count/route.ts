import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  if (!cartId) {
    return NextResponse.json({ count: 0 });
  }

  const items = await prisma.cartItem.findMany({
    where: { cartId },
    select: { quantity: true },
  });

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return NextResponse.json({ count });
}