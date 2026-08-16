import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminRateLimit } from "@/lib/adminGuard";

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit(session.user.id ?? session.user.email ?? "unknown");
  if (rl) return rl;
  const { id } = await params;
  const body = await request.json();
  const { title, excerpt, content, category, image, readMins, published, scheduledAt } = body;

  const schedDate = scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : undefined;
  const isScheduled = schedDate && schedDate > new Date();

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(title      !== undefined && { title:    title.trim() }),
      ...(excerpt    !== undefined && { excerpt:  excerpt?.trim() || null }),
      ...(content    !== undefined && { content:  content.trim() }),
      ...(category   !== undefined && { category }),
      ...(image      !== undefined && { image: image?.trim() || null }),
      ...(readMins   !== undefined && { readMins: Number(readMins) || 3 }),
      ...(scheduledAt !== undefined && {
        published:   isScheduled ? false : (published !== undefined ? !!published : undefined),
        publishedAt: isScheduled ? schedDate : (published ? new Date() : null),
      }),
      ...(published  !== undefined && scheduledAt === undefined && {
        published: !!published,
        publishedAt: published ? new Date() : null,
      }),
    },
  });
  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit(session.user.id ?? session.user.email ?? "unknown");
  if (rl) return rl;
  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
