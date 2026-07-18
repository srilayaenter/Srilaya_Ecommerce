import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) return NextResponse.json({ products: [], bundles: [] });

  // Split into tokens and require every token to match (AND logic)
  const tokens = q.split(/\s+/).filter(Boolean);

  const productWhere = {
    active: true,
    AND: tokens.map(t => ({
      OR: [
        { title:       { contains: t, mode: "insensitive" as const } },
        { description: { contains: t, mode: "insensitive" as const } },
        { category:    { name: { contains: t, mode: "insensitive" as const } } },
      ],
    })),
  };

  const bundleWhere = {
    active: true,
    AND: tokens.map(t => ({
      OR: [
        { title:       { contains: t, mode: "insensitive" as const } },
        { description: { contains: t, mode: "insensitive" as const } },
      ],
    })),
  };

  const [products, bundles] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      include: {
        category: true,
        variants: { where: { active: true }, orderBy: { price: "asc" } },
      },
      take: 30,
    }),
    prisma.bundle.findMany({
      where: bundleWhere,
      take: 10,
    }),
  ]);

  return NextResponse.json({ products, bundles });
}
