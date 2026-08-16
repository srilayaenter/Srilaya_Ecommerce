import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { adminRateLimit } from "@/lib/adminGuard";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit((session.user as any).id ?? (session.user as any).email ?? "unknown");
  if (rl) return rl;

  const { searchParams } = new URL(request.url);
  const sku    = searchParams.get("sku") ?? "";
  const reason = searchParams.get("reason") ?? "";
  const take   = Math.min(parseInt(searchParams.get("take") ?? "100"), 500);

  const logs = await prisma.stockLog.findMany({
    where: {
      ...(sku    ? { sku:    { contains: sku,    mode: "insensitive" } } : {}),
      ...(reason ? { reason: { equals:   reason } }                       : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({ logs });
}
