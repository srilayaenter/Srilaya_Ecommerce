"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  rating: string | null;
  category: { name: string };
  variants: { id: string; size: string; price: string; stock: number }[];
}

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("wishlist") || "[]");
    if (ids.length === 0) { setLoading(false); return; }

    fetch("/api/products/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then(r => r.json())
      .then(data => { setProducts(data.products ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white font-poppins">My Wishlist</h1>
        <p className="text-[#FFF8E1] text-sm mt-1">Products you've saved for later.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <p className="text-center text-[#9E9E9E] py-16">Loading…</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🤍</p>
            <h2 className="text-lg font-bold text-[#212121] mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-[#424242] mb-6">Browse products and tap the heart icon to save them here.</p>
            <Link href="/product" className="inline-block bg-[#006A38] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#00522B] transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
