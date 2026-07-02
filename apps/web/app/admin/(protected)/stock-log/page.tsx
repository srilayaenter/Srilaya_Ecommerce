"use client";

import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: string;
  variantId: string;
  sku: string;
  delta: number;
  reason: string;
  note: string | null;
  userId: string | null;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  order:          "🛒 Online Order",
  offline_order:  "🏪 In-Store Sale",
  return_restock: "↩️ Return Restock",
  csv_import:     "📥 CSV Import",
  manual_edit:    "✏️ Manual Edit",
  po_receive:     "📦 PO Receive",
};

const REASON_COLORS: Record<string, string> = {
  order:          "bg-blue-50 text-blue-700",
  offline_order:  "bg-purple-50 text-purple-700",
  return_restock: "bg-amber-50 text-amber-700",
  csv_import:     "bg-teal-50 text-teal-700",
  manual_edit:    "bg-gray-100 text-gray-600",
  po_receive:     "bg-green-50 text-green-700",
};

export default function StockLogPage() {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sku,     setSku]     = useState("");
  const [reason,  setReason]  = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sku)    params.set("sku", sku);
    if (reason) params.set("reason", reason);
    params.set("take", "200");
    const data = await fetch(`/api/admin/stock-log?${params}`).then(r => r.json());
    setLogs(data.logs ?? []);
    setLoading(false);
  }, [sku, reason]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Stock Adjustment Log</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Every stock change — orders, imports, restocks, edits.</p>
        </div>
        <a
          href="/api/admin/inventory/export"
          className="bg-[#006A38] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#00522B] transition-colors"
        >
          ⬇ Export Current Inventory CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={sku}
          onChange={e => setSku(e.target.value)}
          placeholder="Filter by SKU…"
          className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38] w-48"
        />
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
        >
          <option value="">All reasons</option>
          {Object.entries(REASON_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          className="bg-[#F5F5F5] border border-[#E0E0E0] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#EEEEEE] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#9E9E9E] text-sm">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-bold text-[#212121]">No log entries yet</p>
            <p className="text-sm text-[#9E9E9E] mt-1">Stock changes will appear here as orders, imports, and restocks happen.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F5F5F5] border-b border-[#E0E0E0]">
              <tr className="text-[11px] font-bold uppercase text-[#9E9E9E] tracking-wider">
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Change</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-5 py-3 text-[#9E9E9E] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-[#424242]">{log.sku}</td>
                  <td className="px-5 py-3">
                    <span className={`font-black text-base ${log.delta > 0 ? "text-green-600" : "text-red-500"}`}>
                      {log.delta > 0 ? "+" : ""}{log.delta}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${REASON_COLORS[log.reason] ?? "bg-gray-100 text-gray-500"}`}>
                      {REASON_LABELS[log.reason] ?? log.reason}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#8D6E63] text-xs font-mono">{log.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
