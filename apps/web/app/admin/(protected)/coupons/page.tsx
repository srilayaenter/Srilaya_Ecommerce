"use client";

import { useState, useEffect } from "react";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons,  setCoupons]  = useState<Coupon[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const [code,      setCode]      = useState("");
  const [type,      setType]      = useState<"percentage"|"fixed">("percentage");
  const [value,     setValue]     = useState("");
  const [minOrder,  setMinOrder]  = useState("");
  const [maxUses,   setMaxUses]   = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => { fetchCoupons(); }, []);

  async function fetchCoupons() {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code, type, value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setCode(""); setValue(""); setMinOrder(""); setMaxUses(""); setExpiresAt("");
      fetchCoupons();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to create coupon");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    fetchCoupons();
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    fetchCoupons();
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#212121]">Coupons</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Create and manage discount codes for customers.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-[#006A38] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00522B] transition-colors"
        >
          {showForm ? "Cancel" : "+ New Coupon"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-[#E0E0E0] p-6 mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Coupon Code</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required
              placeholder="e.g. SAVE20"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38] font-mono uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Type</label>
            <select value={type} onChange={e => setType(e.target.value as any)}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#006A38]">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">
              Value ({type === "percentage" ? "%" : "₹"})
            </label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} required min="0.01" step="0.01"
              placeholder={type === "percentage" ? "20" : "100"}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Min Order (₹)</label>
            <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} min="0" step="1"
              placeholder="Optional"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Max Uses</label>
            <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} min="1" step="1"
              placeholder="Unlimited"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Expires On</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
          </div>
          {error && <p className="col-span-full text-sm text-red-600 font-medium">{error}</p>}
          <div className="col-span-full">
            <button type="submit" disabled={saving}
              className="bg-[#006A38] text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60">
              {saving ? "Creating…" : "Create Coupon"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-[#9E9E9E] text-sm">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="p-8 text-center text-[#9E9E9E] text-sm">No coupons yet. Create your first one above.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F5F5] border-b border-[#E0E0E0] text-[11px] font-bold uppercase text-[#9E9E9E] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Discount</th>
                <th className="px-5 py-3.5">Min Order</th>
                <th className="px-5 py-3.5">Uses</th>
                <th className="px-5 py-3.5">Expires</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-[#FAFAF8]">
                  <td className="px-5 py-3.5 font-mono font-bold text-[#006A38]">{c.code}</td>
                  <td className="px-5 py-3.5 font-semibold">
                    {c.type === "percentage" ? `${c.value}%` : `₹${c.value}`} off
                  </td>
                  <td className="px-5 py-3.5 text-[#616161]">
                    {c.minOrder ? `₹${c.minOrder}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[#616161]">
                    {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-5 py-3.5 text-[#616161]">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right flex gap-2 justify-end">
                    <button onClick={() => toggleActive(c.id, c.active)}
                      className="text-xs font-bold text-[#006A38] border border-[#006A38] px-2.5 py-1 rounded-lg hover:bg-[#006A38] hover:text-white transition-colors">
                      {c.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => deleteCoupon(c.id)}
                      className="text-xs font-bold text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                      Delete
                    </button>
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
