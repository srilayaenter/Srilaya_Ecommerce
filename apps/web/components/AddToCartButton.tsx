"use client";
import { useState, useTransition } from "react";
import { addToCart } from "../app/actions/cart";

export default function AddToCartButton({ variantId, maxStock }: { variantId: string; maxStock: number }) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const handleAdd = () => {
    startTransition(async () => {
      const result = await addToCart(variantId, quantity);
      if (result.success) {
        setMessage("Added!");
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage(result.error || "Error adding to cart.");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          className="px-3 py-2 hover:bg-gray-100 font-bold"
          type="button"
        >
          −
        </button>
        <span className="px-4 py-2 border-x-2 border-gray-300 font-semibold min-w-[40px] text-center">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
          className="px-3 py-2 hover:bg-gray-100 font-bold"
          type="button"
        >
          +
        </button>
      </div>

      <button
        disabled={isPending}
        onClick={handleAdd}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400"
      >
        {isPending ? "Adding..." : "Add to Cart"}
      </button>

      {message && (
        <span className={`text-sm font-semibold ${message === "Added!" ? "text-green-600" : "text-red-600"}`}>
          {message}
        </span>
      )}
    </div>
  );
}