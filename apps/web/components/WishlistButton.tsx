"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function WishlistButton({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);

  // On mount: load from DB if logged in, else localStorage
  useEffect(() => {
    if (session === undefined) return; // still loading
    if (session?.user?.id) {
      fetch("/api/wishlist")
        .then(r => r.json())
        .then(({ productIds }: { productIds: string[] }) => setSaved(productIds.includes(productId)))
        .catch(() => {});
    } else {
      const list: string[] = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setSaved(list.includes(productId));
    }
  }, [productId, session]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const next = !saved;
    setSaved(next); // optimistic

    if (session?.user?.id) {
      try {
        if (next) {
          await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
        } else {
          await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
        }
      } catch {
        setSaved(!next); // revert on error
      }
    } else {
      const list: string[] = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const updated = next ? [...list, productId] : list.filter(id => id !== productId);
      localStorage.setItem("wishlist", JSON.stringify(updated));
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm hover:scale-110 transition-transform"
    >
      <svg width="16" height="16" viewBox="0 0 24 24"
        fill={saved ? "#E53935" : "none"}
        stroke={saved ? "#E53935" : "#9E9E9E"}
        strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
