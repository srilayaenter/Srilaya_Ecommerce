"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import WishlistButton from "@/components/WishlistButton";

type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  category: { name: string };
  variants: { price: number }[];
};

type Props = {
  products: Product[];
  categories: string[];
};

const SORT_OPTIONS = [
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function ProductListingClient({ products, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("az");

  const filtered = useMemo(() => {
    let result = activeCategory === "All"
      ? products
      : products.filter((p) => p.category.name === activeCategory);

    return [...result].sort((a, b) => {
      const aMin = a.variants.length ? Math.min(...a.variants.map((v) => v.price)) : 0;
      const bMin = b.variants.length ? Math.min(...b.variants.map((v) => v.price)) : 0;
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "za") return b.title.localeCompare(a.title);
      if (sort === "price_asc") return aMin - bMin;
      if (sort === "price_desc") return bMin - aMin;
      return 0;
    });
  }, [products, activeCategory, sort]);

  return (
    <>
      {/* Filter & sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Category pills — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${activeCategory === cat
                  ? "bg-[#006A38] text-white border-[#006A38]"
                  : "bg-white text-[#006A38] border-[#006A38] hover:bg-[#e8f5ee]"}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label htmlFor="sort" className="text-sm text-gray-500 whitespace-nowrap">Sort:</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#212121] bg-white focus:outline-none focus:ring-2 focus:ring-[#006A38] focus:border-transparent"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-400 mb-4">
        {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
      </p>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No products in this category yet.</p>
          <button
            onClick={() => setActiveCategory("All")}
            className="text-[#006A38] underline text-sm"
          >
            View all products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => {
            const prices = product.variants.map((v) => v.price);
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;
            const priceDisplay =
              minPrice === maxPrice
                ? `₹${minPrice.toFixed(2)}`
                : `₹${minPrice.toFixed(2)} – ₹${maxPrice.toFixed(2)}`;

            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group border border-[#E0E0E0] rounded-xl p-4 hover:shadow-lg transition-shadow bg-white flex flex-col"
              >
                <div className="relative h-48 w-full mb-4 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={product.image || "https://placehold.co/400x400/png?text=SriLaYa+Foods&bg=006A38&fc=white"}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <WishlistButton productId={product.id} />
                </div>

                <div className="text-xs text-[#006A38] font-semibold mb-1">
                  {product.category.name}
                </div>
                <h2 className="font-bold text-[#212121] mb-1">{product.title}</h2>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2 flex-1">
                  {product.description}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {product.variants.length} size{product.variants.length !== 1 ? "s" : ""} available
                </p>
                <p className="text-[#006A38] font-black">{priceDisplay}</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
