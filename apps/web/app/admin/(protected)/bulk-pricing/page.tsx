"use client";

import { useState, useEffect } from "react";

interface Variant {
  id: string;
  size: string;
  price: number;
  sku: string;
  newPrice?: number;
}

interface Product {
  id: string;
  title: string;
  categoryName: string;
  variants: Variant[];
  selected: boolean;
}

type AdjustMode = "percent" | "fixed" | "set";

export default function BulkPricingPage() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [mode,       setMode]       = useState<AdjustMode>("percent");
  const [value,      setValue]      = useState("");
  const [filter,     setFilter]     = useState("");
  const [catFilter,  setCatFilter]  = useState("all");
  const [error,      setError]      = useState("");

  useEffect(() => {
    fetch("/api/admin/bulk-pricing")
      .then(r => r.json())
      .then(d => {
        const items: Product[] = (d.products ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          categoryName: p.category?.name ?? "Uncategorised",
          selected: false,
          variants: (p.variants ?? []).map((v: any) => ({
            id: v.id, size: v.size, sku: v.sku,
            price: parseFloat(v.price),
          })),
        }));
        setProducts(items);
        setLoading(false);
      });
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.categoryName))).sort()];

  const visible = products.filter(p =>
    (catFilter === "all" || p.categoryName === catFilter) &&
    (filter === "" || p.title.toLowerCase().includes(filter.toLowerCase()))
  );

  function toggleAll(checked: boolean) {
    const visIds = new Set(visible.map(p => p.id));
    setProducts(prev => prev.map(p => visIds.has(p.id) ? { ...p, selected: checked } : p));
  }

  function toggleOne(id: string) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  }

  function preview() {
    setError("");
    const num = parseFloat(value);
    if (isNaN(num)) { setError("Enter a valid number."); return; }
    if (mode === "percent" && num <= -100) { setError("Percentage decrease cannot exceed 100%."); return; }

    setProducts(prev => prev.map(p => {
      if (!p.selected) return p;
      return {
        ...p,
        variants: p.variants.map(v => {
          let np: number;
          if (mode === "percent") np = Math.round(v.price * (1 + num / 100) * 100) / 100;
          else if (mode === "fixed") np = Math.round((v.price + num) * 100) / 100;
          else np = Math.round(num * 100) / 100;
          return { ...v, newPrice: Math.max(0.01, np) };
        }),
      };
    }));
  }

  async function applyPrices() {
    const updates: { variantId: string; price: number }[] = [];
    products.forEach(p => {
      if (!p.selected) return;
      p.variants.forEach(v => {
        if (v.newPrice !== undefined && v.newPrice !== v.price) {
          updates.push({ variantId: v.id, price: v.newPrice });
        }
      });
    });
    if (updates.length === 0) { setError("No price changes to apply — run Preview first."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/bulk-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save."); return; }
      setSaved(true);
      setProducts(prev => prev.map(p => ({
        ...p,
        variants: p.variants.map(v => v.newPrice !== undefined ? { ...v, price: v.newPrice, newPrice: undefined } : v),
        selected: false,
      })));
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = products.filter(p => p.selected).length;
  const pendingCount  = products.flatMap(p => p.selected ? p.variants.filter(v => v.newPrice !== undefined) : []).length;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">Bulk Pricing</h1>
        <p className="text-[#8D6E63] text-[14px] mt-1">Adjust prices across multiple products at once.</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">Adjustment type</label>
            <div className="flex rounded-lg border border-[#E0E0E0] overflow-hidden text-sm font-semibold">
              {(["percent", "fixed", "set"] as AdjustMode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setValue(""); }}
                  className={`px-4 py-2 transition-colors capitalize ${mode === m ? "bg-[#006A38] text-white" : "bg-white text-[#616161] hover:bg-[#F5F5F5]"}`}>
                  {m === "percent" ? "% Change" : m === "fixed" ? "₹ Change" : "Set price"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">
              {mode === "percent" ? "Percentage (e.g. 10 or -5)" : mode === "fixed" ? "Amount in ₹ (e.g. 20 or -10)" : "New price in ₹"}
            </label>
            <input value={value} onChange={e => setValue(e.target.value)} type="number" step="0.01"
              placeholder={mode === "percent" ? "e.g. 10" : "e.g. 250"}
              className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:border-[#006A38]" />
          </div>
          <button onClick={preview} disabled={selectedCount === 0 || !value}
            className="bg-[#424242] text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#212121] transition-colors disabled:opacity-40">
            Preview changes
          </button>
          <button onClick={applyPrices} disabled={saving || pendingCount === 0}
            className="bg-[#006A38] text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-40">
            {saving ? "Saving…" : `Apply to ${pendingCount} variant${pendingCount === 1 ? "" : "s"}`}
          </button>
          {saved && <span className="text-sm font-bold text-green-700">✓ Prices updated</span>}
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <p className="text-xs text-[#9E9E9E]">
          {selectedCount === 0 ? "Select products below, then preview changes before applying." : `${selectedCount} product${selectedCount === 1 ? "" : "s"} selected.`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search products…"
          className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:border-[#006A38]" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
          {categories.map(c => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-[#616161] cursor-pointer ml-2">
          <input type="checkbox"
            checked={visible.length > 0 && visible.every(p => p.selected)}
            onChange={e => toggleAll(e.target.checked)}
            className="accent-[#006A38]" />
          Select all visible
        </label>
      </div>

      {/* Product table */}
      {loading ? (
        <div className="text-[#9E9E9E] text-sm">Loading products…</div>
      ) : (
        <div className="space-y-2">
          {visible.map(p => (
            <div key={p.id} className={`bg-white rounded-xl border transition-colors ${p.selected ? "border-[#006A38]" : "border-[#E0E0E0]"}`}>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[#F5F5F5]">
                <input type="checkbox" checked={p.selected} onChange={() => toggleOne(p.id)}
                  className="accent-[#006A38]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#212121] text-sm">{p.title}</p>
                  <p className="text-xs text-[#9E9E9E]">{p.categoryName}</p>
                </div>
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-3">
                {p.variants.map(v => (
                  <div key={v.id} className="flex items-center gap-2 bg-[#F9F9F9] rounded-lg px-3 py-1.5 text-xs">
                    <span className="font-medium text-[#424242]">{v.size}</span>
                    <span className="text-[#9E9E9E]">₹{v.price.toFixed(2)}</span>
                    {v.newPrice !== undefined && (
                      <>
                        <span className="text-[#9E9E9E]">→</span>
                        <span className={`font-bold ${v.newPrice > v.price ? "text-green-700" : "text-red-600"}`}>
                          ₹{v.newPrice.toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="text-center py-12 text-[#9E9E9E] text-sm">No products match your filter.</div>
          )}
        </div>
      )}
    </div>
  );
}
