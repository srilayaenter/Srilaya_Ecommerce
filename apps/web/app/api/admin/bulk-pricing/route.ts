import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

async function guard() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && isAdminRole(session.user.role);
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: { title: "asc" },
    include: {
      category: { select: { name: true } },
      variants: {
        where: { active: true },
        orderBy: { price: "asc" },
        select: { id: true, size: true, price: true, sku: true },
      },
    },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await request.json();
  const updates: { variantId: string; price: number }[] = body.updates ?? [];

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "No updates provided." }, { status: 400 });
  }

  for (const u of updates) {
    if (typeof u.variantId !== "string" || typeof u.price !== "number" || u.price <= 0) {
      return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
    }
  }

  await Promise.all(
    updates.map(u =>
      prisma.productVariant.update({
        where: { id: u.variantId },
        data:  { price: u.price },
      })
    )
  );

  return NextResponse.json({ updated: updates.length });
}
