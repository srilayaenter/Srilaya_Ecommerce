import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { adminRateLimit } from "@/lib/adminGuard";

async function guard() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && isAdminRole(session.user.role) ? session.user : null;
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const session = await getServerSession(authOptions);
  const rl = adminRateLimit((session!.user as any).id ?? (session!.user as any).email ?? "unknown");
  if (rl) return rl;

  // Exact supplier purchase cost (unitCost) is owner-only — omitted entirely
  // from the response for every other role, not just hidden client-side.
  const isOwnerRole = session!.user.role === "owner";

  const orders = await prisma.purchaseOrder.findMany({
    include: {
      supplier: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          sku: true,
          quantityOrdered: true,
          quantityReceived: true,
          ...(isOwnerRole ? { unitCost: true } : {}),
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const user = await guard();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const rl = adminRateLimit((user as any).id ?? (user as any).email ?? "unknown");
  if (rl) return rl;

  const { supplierId, note, expectedAt, items } = await request.json();
  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "supplierId and items required" }, { status: 400 });
  }

  // Resolve SKUs to variantIds
  const skus = items.map((i: any) => i.sku);
  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { id: true, sku: true },
  });
  const skuMap = Object.fromEntries(variants.map(v => [v.sku, v.id]));

  const po = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      note:      note || undefined,
      expectedAt: expectedAt ? new Date(expectedAt) : undefined,
      createdBy: user.email ?? undefined,
      items: {
        create: items
          .filter((i: any) => skuMap[i.sku])
          .map((i: any) => ({
            variantId:       skuMap[i.sku],
            sku:             i.sku,
            quantityOrdered: parseInt(i.quantityOrdered, 10),
            unitCost:        i.unitCost ? parseFloat(i.unitCost) : undefined,
          })),
      },
    },
    include: { items: true, supplier: true },
  });

  return NextResponse.json({ po }, { status: 201 });
}
