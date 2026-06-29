import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;
  if (!cartId) return NextResponse.json({ ok: true });

  await prisma.cart.update({
    where: { id: cartId },
    data: { email: email.trim().toLowerCase() },
  });

  return NextResponse.json({ ok: true });
}
