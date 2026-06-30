"use client";

import { useState } from "react";

export default function NotifyMeButton({ variantId }: { variantId: string }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");
  const [open,    setOpen]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/products/notify-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), variantId }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json();
      setError(d.error ?? "Something went wrong.");
    }
  }

  if (done) {
    return (
      <div className="w-full bg-[#FFF8E1] border border-[#FFE082] text-[#424242] text-sm font-medium px-4 py-3 rounded-xl text-center">
        🔔 We'll email you when this is back in stock!
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-[#E0E0E0] text-[#9E9E9E] font-bold py-3 rounded-xl text-sm hover:border-[#006A38] hover:text-[#006A38] transition-colors"
      >
        🔔 Notify Me When In Stock
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        autoFocus
        className="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#006A38]"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-[#006A38] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60">
          {loading ? "Saving…" : "Notify Me"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-4 py-3 border border-[#E0E0E0] rounded-xl text-sm text-[#9E9E9E] hover:bg-[#F5F5F5] transition-colors">
          ✕
        </button>
      </div>
    </form>
  );
}
