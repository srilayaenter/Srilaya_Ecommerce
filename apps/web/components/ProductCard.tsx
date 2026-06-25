"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addToCart } from "@/app/actions/cart";
import { useCart } from "@/context/CartContext";

interface Variant {
  id: string;
  size: string;
  price: string;
  stock?: number;
}

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    image?: string | null;
    rating?: string | null;
    category: { name: string };
    variants: Variant[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(product.variants[0]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { refreshCartCount } = useCart();

  const ratingDisplay = product.rating ? parseFloat(product.rating).toFixed(1) : '4.5';

  const getCategoryEmoji = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('flake')) return '🌾';
    if (name.includes('millet')) return '🌱';
    if (name.includes('laddu')) return '🍬';
    if (name.includes('sugar') || name.includes('sweet')) return '🍯';
    return '📦';
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg("");
    startTransition(async () => {
      const result = await addToCart(selectedVariant.id, 1);
      if (result.success) {
        setIsAddedSuccess(true);
        await refreshCartCount();
        setTimeout(() => {
          setIsAddedSuccess(false);
          setShowQuickAdd(false);
        }, 1500);
      } else {
        setErrorMsg(result.error || "Could not add to cart.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group relative overflow-hidden">

      {/* Image Frame */}
      <Link href={`/product/${product.slug}`} className="w-full h-52 bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
            <span className="text-5xl transform group-hover:scale-110 transition duration-300">
              {getCategoryEmoji(product.category.name)}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {product.category.name} Pack
            </span>
          </div>
        )}

        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm shadow-sm text-slate-800 text-xs font-bold px-2 py-1 rounded-lg">
          ⭐ {ratingDisplay}
        </span>
      </Link>

      {/* Quick Add Interface */}
      <div className="px-5 pt-4">
        <button
          onClick={() => { setShowQuickAdd(!showQuickAdd); setErrorMsg(""); }}
          className={`w-full text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 border ${
            showQuickAdd
              ? "bg-slate-100 border-slate-200 text-slate-600"
              : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          <span>{showQuickAdd ? "✕ Hide Options" : "⚡ Quick Add"}</span>
        </button>

        {showQuickAdd && (
          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Size</label>
              <select
                value={selectedVariant.id}
                onChange={(e) => {
                  const variant = product.variants.find(v => v.id === e.target.value);
                  if (variant) setSelectedVariant(variant);
                }}
                className="w-full bg-white text-slate-800 text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-600 font-medium cursor-pointer"
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.size} — ₹{parseFloat(v.price)}
                    {(v.stock ?? 1) <= 0 ? " (Out of stock)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isPending || isAddedSuccess || (selectedVariant.stock ?? 1) <= 0}
              className={`w-full text-white font-bold py-2 rounded-lg text-xs transition duration-200 ${
                isAddedSuccess ? "bg-emerald-600" : "bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50"
              }`}
            >
              {isPending ? "Adding..." : isAddedSuccess ? "✓ Added!" : "Add to Cart"}
            </button>
          </div>
        )}
      </div>

      {/* Product Details */}
      <Link href={`/product/${product.slug}`} className="p-5 pt-3 flex flex-col flex-grow justify-between bg-white">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
            {product.category.name}
          </span>
          <h3 className="font-bold text-base text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors mb-1">
            {product.title}
          </h3>
          <p className="text-xs text-slate-400 font-medium mb-4">
            Size: <span className="text-slate-600 font-bold">{selectedVariant.size}</span>
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium leading-none mb-1">Price</span>
            <span className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
              ₹{parseFloat(selectedVariant.price)}
            </span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-emerald-700 text-slate-400 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm">
            →
          </div>
        </div>
      </Link>
    </div>
  );
}
