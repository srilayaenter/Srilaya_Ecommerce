import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminRateLimit } from "@/lib/adminGuard";

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["owner", "admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit(session.user.id ?? session.user.email ?? "unknown");
  if (rl) return rl;
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["owner", "admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit(session.user.id ?? session.user.email ?? "unknown");
  if (rl) return rl;
  const body = await request.json();
  const { title, excerpt, content, category, image, readMins, published, scheduledAt } = body;
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }
  const base = slug(title.trim());
  let s = base;
  let i = 1;
  while (await prisma.blogPost.findUnique({ where: { slug: s } })) s = `${base}-${i++}`;

  const schedDate = scheduledAt ? new Date(scheduledAt) : null;
  const isScheduled = schedDate && schedDate > new Date();

  const post = await prisma.blogPost.create({
    data: {
      slug: s, title: title.trim(),
      excerpt: excerpt?.trim() || null,
      content: content.trim(),
      category: category || "article",
      image: image?.trim() || null,
      readMins: Number(readMins) || 3,
      published: isScheduled ? false : !!published,
      publishedAt: isScheduled ? schedDate : (published ? new Date() : null),
    },
  });
  return NextResponse.json({ post }, { status: 201 });
}
