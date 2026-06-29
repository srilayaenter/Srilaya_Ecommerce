"use client";

import { useState, useEffect } from "react";

interface CouponState {
  code: string;
  discount: number;
  label: string;
}

export default function CouponInput({ orderTotal }: { orderTotal: number }) {
  const [code,     setCode]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [applied,  setApplied]  = useState<CouponState | null>(null);

  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("coupon");
    if (saved) {
      try { setApplied(JSON.parse(saved)); } catch {}
    }
  }, []);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/coupons/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim(), orderTotal }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      const coupon: CouponState = { code: data.code, discount: data.discount, label: data.label };
      setApplied(coupon);
      sessionStorage.setItem("coupon", JSON.stringify(coupon));
      setCode("");
    } else {
      setError(data.error ?? "Invalid coupon");
    }
  }

  function handleRemove() {
    setApplied(null);
    sessionStorage.removeItem("coupon");
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Coupon Applied</p>
          <p className="text-sm font-black text-green-800 font-mono mt-0.5">{applied.code}</p>
          <p className="text-xs text-green-600">{applied.label} — saves ₹{applied.discount.toFixed(2)}</p>
        </div>
        <button onClick={handleRemove} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38] font-mono uppercase"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="bg-[#006A38] text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "…" : "Apply"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </form>
  );
}
