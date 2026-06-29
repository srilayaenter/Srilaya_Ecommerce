import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const variants = await prisma.productVariant.findMany({
    include: { product: { select: { title: true } } },
    orderBy: [{ product: { title: "asc" } }, { size: "asc" }],
  });
  return NextResponse.json({ variants });
}
