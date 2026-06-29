import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

async function guard() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && isAdminRole(session.user.role);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const data = await request.json();
  const bundle = await prisma.bundle.update({ where: { id: params.id }, data });
  return NextResponse.json({ bundle });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  await prisma.bundle.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
