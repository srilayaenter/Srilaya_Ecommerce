import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isAdminRole(session.user.role)) return false;
  return true;
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json();
  const { code, type, value, minOrder, maxUses, expiresAt } = body;

  if (!code || !type || !value) {
    return NextResponse.json({ error: "code, type, value are required" }, { status: 400 });
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value,
        minOrder: minOrder || null,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id, active } = await request.json();
  const coupon = await prisma.coupon.update({ where: { id }, data: { active } });
  return NextResponse.json({ coupon });
}

export async function DELETE(request: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
