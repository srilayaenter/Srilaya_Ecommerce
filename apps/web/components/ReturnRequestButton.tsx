"use client";

import { useState } from "react";

interface OrderItem {
  title: string;
  size: string;
  quantity: number;
  variantId?: string;
}

interface Props {
  orderId: string;
  contact: string;
  items: OrderItem[];
}

const REASONS = [
  "Wrong item received",
  "Damaged / defective product",
  "Product not as described",
  "Expired / quality issue",
  "Other",
];

export default function ReturnRequestButton({ orderId, contact, items }: Props) {
  const [open,     setOpen]     = useState(false);
  const [reason,   setReason]   = useState("");
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  function toggleItem(idx: number, maxQty: number) {
    setSelected(prev => {
      if (prev[idx]) {
        const n = { ...prev };
        delete n[idx];
        return n;
      }
      return { ...prev, [idx]: maxQty };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const returnItems = Object.entries(selected).map(([idx, qty]) => ({
      ...items[parseInt(idx)],
      quantity: qty,
    })).filter(i => i.variantId);

    if (!returnItems.length) { setError("Select at least one item."); return; }
    if (!reason) { setError("Please select a reason."); return; }

    setLoading(true);
    setError("");
    const res = await fetch("/api/orders/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, contact, reason, items: returnItems }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to submit return.");
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
        ✅ Return request submitted. We'll review it within 1–2 business days.
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-[#9E9E9E] text-[#616161] text-sm font-bold px-4 py-2.5 rounded-xl hover:border-[#006A38] hover:text-[#006A38] transition-colors"
      >
        ↩️ Request Return
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-[#212121]">Request a Return</h2>
              <button onClick={() => setOpen(false)} className="text-[#9E9E9E] hover:text-[#212121] text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">Select items to return</p>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <label key={idx} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected[idx] ? "border-[#006A38] bg-[#006A38]/5" : "border-[#E0E0E0]"}`}>
                      <input
                        type="checkbox"
                        checked={!!selected[idx]}
                        onChange={() => toggleItem(idx, item.quantity)}
                        className="accent-[#006A38] w-4 h-4"
                      />
                      <span className="text-sm text-[#212121]">
                        {item.title} <span className="text-[#9E9E9E]">({item.size}) × {item.quantity}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">Reason *</label>
                <select value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38]">
                  <option value="">Select a reason…</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#006A38] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60">
                  {loading ? "Submitting…" : "Submit Return Request"}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-4 py-3 border border-[#E0E0E0] rounded-xl text-sm font-bold text-[#616161] hover:bg-[#F5F5F5] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
