"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface RecommendedProduct {
  slug: string;
  title: string;
  image: string | null;
  price: number | null;
}

export default function ProductRecommendations({ slug }: { slug: string }) {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);

  useEffect(() => {
    fetch(`/api/products/${slug}/recommendations`)
      .then(r => r.ok ? r.json() : { products: [] })
      .then(d => setProducts(d.products ?? []))
      .catch(() => {});
  }, [slug]);

  if (products.length === 0) return null;

  return (
    <div className="mt-10 border-t border-[#E0E0E0] pt-8">
      <h2 className="text-xl font-black text-[#212121] mb-5">Customers Also Bought</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.map(p => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            className="group bg-white border border-[#E0E0E0] rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square bg-[#F5F5F5]">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🌾</div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-[#212121] line-clamp-2 leading-snug">{p.title}</p>
              {p.price !== null && (
                <p className="text-sm font-black text-[#006A38] mt-1">₹{p.price.toFixed(2)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
