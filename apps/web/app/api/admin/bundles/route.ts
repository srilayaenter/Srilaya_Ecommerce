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
  const bundles = await prisma.bundle.findMany({
    include: { items: { include: { variant: { include: { product: { select: { title: true } } } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bundles: bundles.map(b => ({
    ...b,
    price: parseFloat(b.price.toString()),
  }))});
}

export async function POST(request: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { title, slug, description, price, items } = await request.json();
  if (!title || !slug || !price || !items?.length) {
    return NextResponse.json({ error: "title, slug, price, and items are required." }, { status: 400 });
  }
  try {
    const bundle = await prisma.bundle.create({
      data: {
        title, slug, description: description || null, price,
        items: { create: items.map((i: { variantId: string; quantity: number }) => ({ variantId: i.variantId, quantity: i.quantity })) },
      },
      include: { items: { include: { variant: { include: { product: { select: { title: true } } } } } } },
    });
    return NextResponse.json({ bundle: { ...bundle, price: parseFloat(bundle.price.toString()) } });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
    throw e;
  }
}
