import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  // Revalidate all content caches
  revalidateTag("blog");
  revalidateTag("recipes");
  revalidateTag("products");

  const [blogCount, catCount, prodCount] = await Promise.all([
    prisma.blogPost.count({ where: { published: true } }),
    prisma.category.count(),
    prisma.product.count(),
  ]);
  const dbUrl = process.env.DATABASE_URL ?? "";
  const projectMatch = dbUrl.match(/postgres\.([a-z0-9]+):/);
  const project = projectMatch ? projectMatch[1] : "unknown";
  return NextResponse.json({ project, blogCount, catCount, prodCount, revalidated: true });
}
