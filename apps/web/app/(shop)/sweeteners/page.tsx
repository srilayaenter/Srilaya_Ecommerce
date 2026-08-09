import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import SweetenersPageClient from "./SweetenersPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Natural Sweeteners Collection â€” Sweet Without the Guilt | SriLaYa Naturals",
  description:
    "Shop SriLaYa's natural jaggery powder collection â€” Sugarcane, Palm, and Coconut Jaggery. Unrefined, mineral-rich, low GI alternatives to refined sugar. Free local delivery in Whitefield, Bangalore.",
};

const fetchSweetenerImages = unstable_cache(
  async () => {
    let products: { title: string; image: string | null; images: { url: string }[] }[] = [];
    try {
      products = await prisma.product.findMany({
        where: { category: { slug: "sweeteners" }, active: true },
        select: {
          title: true,
          image: true,
          images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
        },
      });
    } catch {}

    const map: Record<string, string> = {};
    for (const p of products) {
      const url = p.images[0]?.url ?? p.image ?? "";
      if (url) map[p.title.toLowerCase()] = url;
    }
    return map;
  },
  ["sweetener-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function SweetenersPage() {
  const productImageMap = await fetchSweetenerImages();
  return <SweetenersPageClient productImageMap={productImageMap} />;
}

