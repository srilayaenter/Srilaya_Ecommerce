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
  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, contactPerson: true, phone: true, email: true },
  });
  return NextResponse.json({ suppliers });
}

export async function POST(request: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const data = await request.json();
  const supplier = await prisma.supplier.create({
    data: {
      name:          data.name,
      contactPerson: data.contactPerson || undefined,
      phone:         data.phone || undefined,
      email:         data.email || undefined,
      address:       data.address || undefined,
      notes:         data.notes || undefined,
    },
  });
  return NextResponse.json({ supplier }, { status: 201 });
}
