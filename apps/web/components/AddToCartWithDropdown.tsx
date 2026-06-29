"use client";
import { useState, useTransition } from "react";
import { addToCart } from "../app/actions/cart";
import { useCart } from "@/context/CartContext";
import NotifyMeButton from "@/components/NotifyMeButton";

interface Variant {
  id: string;
  size: string;
  price: number;
  stock: number;
}

export default function AddToCartWithDropdown({ variants }: { variants: Variant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id || "");
  const [quantity, setQuantity] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const { refreshCartCount } = useCart();

  const selected = variants.find(v => v.id === selectedId);

  const handleAdd = () => {
    if (!selected || quantity <= 0) return;

    startTransition(async () => {
      const result = await addToCart(selected.id, quantity);
      if (result.success) {
        setMessage("Added!");
        setQuantity(0);
        await refreshCartCount();
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage(result.error || "Error adding to cart.");
      }
    });
  };

  if (!selected) return null;

  return (
    <div>
      {/* Size Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Size:
        </label>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setQuantity(0);
          }}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#006A38] focus:border-transparent outline-none text-lg"
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.size} — ₹{v.price.toFixed(2)} {v.stock <= 0 ? "(Out of Stock)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div className="text-3xl font-black text-[#006A38] mb-4">
        ₹{selected.price.toFixed(2)}
      </div>

      {/* Stock */}
      <p className="text-sm text-gray-500 mb-6">
        {selected.stock > 0
          ? `In Stock: ${selected.stock}`
          : <span className="text-red-500 font-bold">Out of Stock</span>}
      </p>

      {/* Out of stock — notify me */}
      {selected.stock <= 0 && <NotifyMeButton variantId={selected.id} />}

      {/* Quantity + Add to Cart */}
      {selected.stock > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity(q => Math.max(0, q - 1))}
              className="px-3 py-2 hover:bg-gray-100 font-bold"
              type="button"
            >
              −
            </button>
            <span className="px-4 py-2 border-x-2 border-gray-300 font-semibold min-w-[40px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(q => Math.min(selected.stock, q + 1))}
              className="px-3 py-2 hover:bg-gray-100 font-bold"
              type="button"
            >
              +
            </button>
          </div>

          <button
            disabled={isPending || quantity <= 0}
            onClick={handleAdd}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isPending ? "Adding..." : "Add to Cart"}
          </button>

          {message && (
            <span className={`text-sm font-semibold ${message === "Added!" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </span>
          )}
        </div>
      )}
    </div>
  );
}