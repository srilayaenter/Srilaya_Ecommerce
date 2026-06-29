"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface RecentProduct {
  slug: string;
  title: string;
  image: string | null;
  price: number;
}

const KEY = "srilaya_recently_viewed";
const MAX = 6;

export function recordView(product: RecentProduct) {
  try {
    const existing: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const filtered = existing.filter(p => p.slug !== product.slug);
    const updated  = [product, ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      setProducts(excludeSlug ? stored.filter(p => p.slug !== excludeSlug) : stored);
    } catch {}
  }, [excludeSlug]);

  if (products.length === 0) return null;

  return (
    <section className="py-10">
      <h2 className="text-lg font-black text-[#212121] mb-5">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {products.map(p => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            className="group bg-white border border-[#E0E0E0] rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="relative h-24 bg-[#F5F5F5]">
              <Image
                src={p.image ?? `https://placehold.co/200x200/006A38/white?text=${encodeURIComponent(p.title)}`}
                alt={p.title}
                fill
                className="object-contain p-2"
                sizes="200px"
                unoptimized={!!p.image}
              />
            </div>
            <div className="p-2">
              <p className="text-[11px] font-semibold text-[#212121] line-clamp-2 leading-snug group-hover:text-[#006A38] transition-colors">
                {p.title}
              </p>
              <p className="text-[11px] font-black text-[#006A38] mt-0.5">₹{p.price.toFixed(0)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
