"use client";
import { useTransition } from "react";
import { addToCart } from "../app/actions/cart"; // Import the server action

export default function AddToCartButton({ variantId }: { variantId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => {
        const result = await addToCart(variantId);
        if (result.success) {
          alert("Successfully added to cart!");
        } else {
          alert("Error adding to cart.");
        }
      })}
      className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
    >
      {isPending ? "Adding..." : "Add to Cart"}
    </button>
  );
}