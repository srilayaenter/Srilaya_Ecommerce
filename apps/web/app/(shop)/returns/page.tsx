"use client";

import { useState } from "react";
import Link from "next/link";

type OrderItem = { variantId: string; title: string; size: string; quantity: number };
type OrderData  = { id: string; items: OrderItem[] };

const REASONS = [
  "Wrong item received",
  "Item damaged or defective",
  "Quality not as expected",
  "Expired or near-expiry product",
  "Changed my mind",
  "Other",
];

export default function ReturnsPage() {
  const [step,      setStep]      = useState<"lookup" | "select" | "done">("lookup");
  const [orderId,   setOrderId]   = useState("");
  const [contact,   setContact]   = useState("");
  const [order,     setOrder]     = useState<OrderData | null>(null);
  const [selected,  setSelected]  = useState<Record<string, number>>({});
  const [reason,    setReason]    = useState(REASONS[0]);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  async function lookupOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/lookup?orderId=${encodeURIComponent(orderId)}&contact=${encodeURIComponent(contact)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Order not found."); return; }
      setOrder(data.order);
      const init: Record<string, number> = {};
      data.order.items.forEach((i: OrderItem) => { init[i.variantId] = i.quantity; });
      setSelected(init);
      setStep("select");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitReturn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const items = order!.items
      .filter(i => (selected[i.variantId] ?? 0) > 0)
      .map(i => ({ variantId: i.variantId, title: i.title, size: i.size, quantity: selected[i.variantId] }));
    if (items.length === 0) { setError("Please select at least one item to return."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order!.id, contact, reason, items }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not submit return request."); return; }
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white">Request a Return</h1>
        <p className="text-green-200 text-sm mt-1">7-day return window from date of delivery</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-12">

        {step === "done" && (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-bold text-[#212121] mb-2">Return request submitted</h2>
            <p className="text-sm text-[#616161] mb-6">
              Our team will review your request and respond within 2 business days. You'll receive an update at your email.
            </p>
            <Link href="/" className="inline-block bg-[#006A38] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#00522B] transition-colors">
              Back to shop
            </Link>
          </div>
        )}

        {step === "lookup" && (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8">
            <h2 className="text-base font-bold text-[#212121] mb-1">Find your order</h2>
            <p className="text-sm text-[#9E9E9E] mb-6">Enter your order ID and the email or phone you used at checkout.</p>
            <form onSubmit={lookupOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Order ID</label>
                <input
                  value={orderId} onChange={e => setOrderId(e.target.value)} required
                  placeholder="e.g. A1B2C3D4"
                  className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Email or Phone</label>
                <input
                  value={contact} onChange={e => setContact(e.target.value)} required
                  placeholder="email@example.com or 9876543210"
                  className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]"
                />
              </div>
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-[#006A38] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60">
                {loading ? "Looking up…" : "Find Order →"}
              </button>
            </form>
            <p className="text-xs text-[#9E9E9E] mt-4 text-center">
              Need help? <Link href="/contact" className="text-[#006A38] hover:underline">Contact us</Link> ·{" "}
              <Link href="/returns-policy" className="text-[#006A38] hover:underline">Returns policy</Link>
            </p>
          </div>
        )}

        {step === "select" && order && (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-[#212121]">Select items to return</h2>
                <p className="text-xs text-[#9E9E9E] font-mono mt-0.5">Order #{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => { setStep("lookup"); setOrder(null); setError(""); }}
                className="text-xs text-[#9E9E9E] hover:text-[#212121]">← Back</button>
            </div>

            <form onSubmit={submitReturn} className="space-y-5">
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.variantId} className="flex items-center justify-between border border-[#F0F0F0] rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#212121]">{item.title}</p>
                      <p className="text-xs text-[#9E9E9E]">{item.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#616161]">Qty</label>
                      <select
                        value={selected[item.variantId] ?? 0}
                        onChange={e => setSelected(prev => ({ ...prev, [item.variantId]: Number(e.target.value) }))}
                        className="border border-[#E0E0E0] rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#006A38]"
                      >
                        {Array.from({ length: item.quantity + 1 }, (_, i) => (
                          <option key={i} value={i}>{i === 0 ? "Don't return" : i}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Reason for return</label>
                <select
                  value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]"
                >
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-[#006A38] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60">
                {loading ? "Submitting…" : "Submit Return Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
