"use client";

import { useState, useEffect } from "react";

interface ReturnRequest {
  id: string;
  status: string;
  reason: string;
  adminNote: string | null;
  createdAt: string;
  order: { id: string; customerName: string; email: string; phone: string; total: number };
  items: { title: string; size: string; quantity: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-50 text-amber-700",
  approved:  "bg-blue-50 text-blue-700",
  rejected:  "bg-red-50 text-red-700",
  refunded:  "bg-green-50 text-green-700",
};

export default function ReturnsAdminPage() {
  const [returns,  setReturns]  = useState<ReturnRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("requested");
  const [noteMap,  setNoteMap]  = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/returns").then(r => r.json()).then(d => {
      setReturns(d.returns ?? []);
      setLoading(false);
    });
  }, []);

  async function updateStatus(returnId: string, status: string) {
    setSaving(returnId);
    await fetch("/api/admin/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnId, status, adminNote: noteMap[returnId] ?? "" }),
    });
    setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status, adminNote: noteMap[returnId] ?? r.adminNote } : r));
    setSaving(null);
  }

  const filtered = filter === "all" ? returns : returns.filter(r => r.status === filter);

  if (loading) return <div className="text-[#9E9E9E] text-sm">Loading…</div>;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">Return Requests</h1>
        <p className="text-[#8D6E63] text-[14px] mt-1">Review and action customer return requests.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["requested", "approved", "rejected", "refunded", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg border transition-colors capitalize ${
              filter === s ? "bg-[#006A38] text-white border-[#006A38]" : "bg-white border-[#E0E0E0] text-[#9E9E9E] hover:text-[#212121]"
            }`}>
            {s} {s !== "all" && `(${returns.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] py-16 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-bold text-[#212121]">No {filter} returns</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <p className="font-mono font-bold text-[#006A38]">#{r.order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-semibold text-[#212121]">{r.order.customerName}</p>
                  <p className="text-xs text-[#9E9E9E]">{r.order.email} · {r.order.phone}</p>
                  <p className="text-xs text-[#9E9E9E] mt-0.5">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {r.status}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider mb-1">Return Items</p>
                  <ul className="space-y-0.5">
                    {r.items.map((item, i) => (
                      <li key={i} className="text-sm text-[#424242]">{item.title} <span className="text-[#9E9E9E]">({item.size}) × {item.quantity}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider mb-1">Reason</p>
                  <p className="text-sm text-[#424242]">{r.reason}</p>
                  {r.adminNote && (
                    <p className="text-xs text-[#8D6E63] mt-1 italic">Note: {r.adminNote}</p>
                  )}
                </div>
              </div>

              {r.status === "requested" && (
                <div className="border-t border-[#F5F5F5] pt-4 space-y-3">
                  <textarea
                    value={noteMap[r.id] ?? ""}
                    onChange={e => setNoteMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Optional note to customer…"
                    rows={2}
                    className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#006A38]"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(r.id, "approved")} disabled={saving === r.id}
                      className="bg-[#006A38] text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60">
                      ✓ Approve
                    </button>
                    <button onClick={() => updateStatus(r.id, "rejected")} disabled={saving === r.id}
                      className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
                      ✗ Reject
                    </button>
                  </div>
                </div>
              )}

              {r.status === "approved" && (
                <div className="border-t border-[#F5F5F5] pt-4">
                  <button onClick={() => updateStatus(r.id, "refunded")} disabled={saving === r.id}
                    className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
                    💰 Mark as Refunded
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
