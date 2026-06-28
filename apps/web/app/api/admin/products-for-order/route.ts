import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { toNum } from "@/lib/decimal";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { active: true },
    select: {
      id: true,
      title: true,
      variants: {
        select: { id: true, size: true, price: true, stock: true, sku: true },
        orderBy: { price: 'asc' },
      },
    },
    orderBy: { title: 'asc' },
  });

  return NextResponse.json(
    products.map(p => ({
      ...p,
      variants: p.variants.map(v => ({ ...v, price: toNum(v.price) })),
    }))
  );
}
