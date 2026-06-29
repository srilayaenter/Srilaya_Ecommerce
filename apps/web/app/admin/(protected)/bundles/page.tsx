"use client";

import { useState, useEffect } from "react";

interface Variant { id: string; size: string; sku: string; product: { title: string } }
interface BundleItem { variantId: string; quantity: number }
interface Bundle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  active: boolean;
  items: (BundleItem & { variant: { size: string; product: { title: string } } })[];
}

export default function BundlesAdminPage() {
  const [bundles,  setBundles]  = useState<Bundle[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  // Form state
  const [title,       setTitle]       = useState("");
  const [slug,        setSlug]        = useState("");
  const [description, setDescription] = useState("");
  const [price,       setPrice]       = useState("");
  const [items,       setItems]       = useState<BundleItem[]>([{ variantId: "", quantity: 1 }]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/bundles").then(r => r.json()),
      fetch("/api/admin/variants").then(r => r.json()),
    ]).then(([b, v]) => {
      setBundles(b.bundles ?? []);
      setVariants(v.variants ?? []);
      setLoading(false);
    });
  }, []);

  function autoSlug(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug: slug || autoSlug(title), description, price: parseFloat(price), items: items.filter(i => i.variantId) }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setBundles(prev => [data.bundle, ...prev]);
      setTitle(""); setSlug(""); setDescription(""); setPrice("");
      setItems([{ variantId: "", quantity: 1 }]);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to create bundle.");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/bundles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setBundles(prev => prev.map(b => b.id === id ? { ...b, active: !active } : b));
  }

  async function deleteBundle(id: string) {
    if (!confirm("Delete this bundle?")) return;
    await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" });
    setBundles(prev => prev.filter(b => b.id !== id));
  }

  if (loading) return <div className="text-[#9E9E9E] text-sm">Loading…</div>;

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">Product Bundles</h1>
        <p className="text-[#8D6E63] text-[14px] mt-1">Create combo packs like "Millet Starter Pack" to increase order value.</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#212121] mb-5">Create New Bundle</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1">Title *</label>
              <input value={title} onChange={e => { setTitle(e.target.value); setSlug(autoSlug(e.target.value)); }}
                required className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" placeholder="Millet Starter Pack" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1">Slug *</label>
              <input value={slug} onChange={e => setSlug(e.target.value)}
                required className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#006A38]" placeholder="millet-starter-pack" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1">Bundle Price (₹) *</label>
              <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
                required className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" placeholder="499.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" placeholder="Best value combo for beginners" />
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-2">Bundle Items *</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={item.variantId} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, variantId: e.target.value } : it))}
                    className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                    <option value="">Select variant…</option>
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>{v.product.title} — {v.size} [{v.sku}]</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={item.quantity}
                    onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                    className="w-16 border border-[#E0E0E0] rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-[#006A38]" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 text-lg font-bold">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setItems(prev => [...prev, { variantId: "", quantity: 1 }])}
              className="mt-2 text-xs text-[#006A38] font-bold hover:underline">+ Add item</button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving}
            className="bg-[#006A38] text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60">
            {saving ? "Saving…" : "Create Bundle"}
          </button>
        </form>
      </div>

      {/* Bundles list */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        {bundles.length === 0 ? (
          <div className="py-12 text-center text-[#9E9E9E] text-sm">No bundles created yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] text-[10px] uppercase tracking-wider text-[#9E9E9E]">
              <tr>
                <th className="text-left px-5 py-3">Bundle</th>
                <th className="text-left px-5 py-3">Items</th>
                <th className="text-right px-5 py-3">Price</th>
                <th className="text-center px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {bundles.map(b => (
                <tr key={b.id} className="hover:bg-[#FFF8E1]/30">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-[#212121]">{b.title}</p>
                    <p className="text-xs text-[#9E9E9E] font-mono">{b.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-0.5">
                      {b.items.map((item, i) => (
                        <p key={i} className="text-xs text-[#616161]">{item.variant.product.title} ({item.variant.size}) × {item.quantity}</p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-[#006A38]">₹{b.price.toFixed(2)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {b.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => toggleActive(b.id, b.active)}
                        className="text-xs border border-[#E0E0E0] px-2.5 py-1 rounded-lg hover:bg-[#F5F5F5] font-medium">
                        {b.active ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => deleteBundle(b.id)}
                        className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-50 font-medium">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
