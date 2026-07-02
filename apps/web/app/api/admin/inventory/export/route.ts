import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager", "inventory_staff"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const variants = await prisma.productVariant.findMany({
    include: { product: { select: { title: true, sku: true } } },
    orderBy: [{ product: { title: "asc" } }, { size: "asc" }],
  });

  const rows = [
    ["sku", "product", "size", "stock", "price", "reorderThreshold"],
    ...variants.map(v => [
      v.sku,
      v.product.title,
      v.size,
      String(v.stock),
      toNum(v.price).toFixed(2),
      String(v.reorderThreshold),
    ]),
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory_${date}.csv"`,
    },
  });
}
