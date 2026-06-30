import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!["admin", "manager"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!["admin", "manager"].includes(session?.user?.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const body = await request.json();
  const { title, excerpt, content, category, image, readMins, published } = body;
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }
  const base = slug(title.trim());
  let s = base;
  let i = 1;
  while (await prisma.blogPost.findUnique({ where: { slug: s } })) s = `${base}-${i++}`;

  const post = await prisma.blogPost.create({
    data: {
      slug: s, title: title.trim(),
      excerpt: excerpt?.trim() || null,
      content: content.trim(),
      category: category || "article",
      image: image?.trim() || null,
      readMins: Number(readMins) || 3,
      published: !!published,
      publishedAt: published ? new Date() : null,
    },
  });
  return NextResponse.json({ post }, { status: 201 });
}
