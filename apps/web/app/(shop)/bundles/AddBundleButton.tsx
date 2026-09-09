"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddBundleButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const router = useRouter();

  async function handleAdd() {
    setLoading(true);
    await fetch("/api/cart/add-bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bundleSlug: slug }),
    });
    setLoading(false);
    setDone(true);
    setTimeout(() => router.push("/cart"), 800);
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading || done}
      className="bg-[#006A38] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60"
    >
      {done ? "✓ Added!" : loading ? "Adding…" : "Add to Cart"}
    </button>
  );
}
