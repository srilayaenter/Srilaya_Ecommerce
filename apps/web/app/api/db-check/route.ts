import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const [blogCount, catCount, prodCount] = await Promise.all([
    prisma.blogPost.count({ where: { published: true } }),
    prisma.category.count(),
    prisma.product.count(),
  ]);
  const dbUrl = process.env.DATABASE_URL ?? "";
  const projectMatch = dbUrl.match(/postgres\.([a-z0-9]+):/);
  const project = projectMatch ? projectMatch[1] : "unknown";
  return NextResponse.json({ project, blogCount, catCount, prodCount });
}
