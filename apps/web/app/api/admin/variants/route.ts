import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { adminRateLimit } from "@/lib/adminGuard";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit((session.user as any).id ?? (session.user as any).email ?? "unknown");
  if (rl) return rl;

  // Exact cost price is owner-only — omitted entirely from the response for
  // every other role, not just hidden client-side.
  const isOwnerRole = session.user.role === "owner";

  const variants = await prisma.productVariant.findMany({
    select: {
      id: true,
      productId: true,
      size: true,
      price: true,
      stock: true,
      sku: true,
      createdAt: true,
      updatedAt: true,
      weightGrams: true,
      reorderThreshold: true,
      imageUrl: true,
      active: true,
      ...(isOwnerRole ? { costPrice: true } : {}),
      product: { select: { title: true } },
    },
    orderBy: [{ product: { title: "asc" } }, { size: "asc" }],
  });
  return NextResponse.json({ variants });
}
