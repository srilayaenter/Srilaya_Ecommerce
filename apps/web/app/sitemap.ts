import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://srilaya.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, bundles, blogPosts] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.bundle.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,               lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/product`,  lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/bundles`,  lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/blog`,     lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/about`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/track`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map(p => ({
    url:             `${BASE_URL}/product/${p.slug}`,
    lastModified:    p.updatedAt,
    changeFrequency: "weekly",
    priority:        0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
    url:             `${BASE_URL}/category/${c.slug}`,
    lastModified:    new Date(),
    changeFrequency: "weekly",
    priority:        0.7,
  }));

  const bundlePages: MetadataRoute.Sitemap = bundles.map(b => ({
    url:             `${BASE_URL}/bundles`,
    lastModified:    b.updatedAt,
    changeFrequency: "weekly",
    priority:        0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map(p => ({
    url:             `${BASE_URL}/blog/${p.slug}`,
    lastModified:    p.updatedAt,
    changeFrequency: "monthly",
    priority:        0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...bundlePages, ...blogPages];
}
