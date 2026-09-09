"use client";

import { useState, useEffect, useCallback } from "react";
import { Note, PaperPlaneTilt, Package, CheckCircle, XCircle, ClipboardText, ArrowCircleDown } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

interface POItem {
  id: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number | null;
}

interface PO {
  id: string;
  status: string;
  note: string | null;
  expectedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  supplier: { id: string; name: string };
  items: POItem[];
}

interface Supplier { id: string; name: string; }
interface Variant  { id: string; sku: string; size: string; product: { title: string }; }

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  sent:      "bg-blue-50 text-blue-700",
  partial:   "bg-amber-50 text-amber-700",
  received:  "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-500",
};

const STATUS_ICONS: Record<string, PhosphorIcon> = {
  draft: Note, sent: PaperPlaneTilt, partial: Package, received: CheckCircle, cancelled: XCircle,
};

export default function PurchaseOrdersPage() {
  const [pos,       setPos]       = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [variants,  setVariants]  = useState<Variant[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [filter,    setFilter]    = useState("all");

  // create form state
  const [supplierId,  setSupplierId]  = useState("");
  const [note,        setNote]        = useState("");
  const [expectedAt,  setExpectedAt]  = useState("");
  const [poItems,     setPoItems]     = useState([{ sku: "", qty: "", cost: "" }]);
  const [creating,    setCreating]    = useState(false);

  // receive state
  const [receiveMap, setReceiveMap] = useState<Record<string, Record<string, string>>>({});
  const [receiving,  setReceiving]  = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [posRes, suppRes, varRes] = await Promise.all([
      fetch("/api/admin/purchase-orders").then(r => r.json()),
      fetch("/api/admin/suppliers").then(r => r.json()),
      fetch("/api/admin/variants").then(r => r.json()),
    ]);
    setPos(posRes.orders ?? []);
    setSuppliers(suppRes.suppliers ?? []);
    setVariants(varRes.variants ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function createPO() {
    if (!supplierId) return;
    setCreating(true);
    const items = poItems.filter(i => i.sku && i.qty);
    const res = await fetch("/api/admin/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId,
        note:       note || undefined,
        expectedAt: expectedAt || undefined,
        items: items.map(i => ({ sku: i.sku, quantityOrdered: i.qty, unitCost: i.cost || undefined })),
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setSupplierId(""); setNote(""); setExpectedAt("");
      setPoItems([{ sku: "", qty: "", cost: "" }]);
      fetchAll();
    }
    setCreating(false);
  }

  async function updateStatus(poId: string, status: string) {
    await fetch(`/api/admin/purchase-orders/${poId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  }

  async function receivePO(po: PO) {
    setReceiving(po.id);
    const map = receiveMap[po.id] ?? {};
    const receivedItems = po.items
      .filter(item => map[item.id] && parseInt(map[item.id], 10) > 0)
      .map(item => ({ poItemId: item.id, quantityReceived: parseInt(map[item.id], 10) }));
    if (!receivedItems.length) { setReceiving(null); return; }
    await fetch(`/api/admin/purchase-orders/${po.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "receive", receivedItems }),
    });
    setReceiveMap(prev => ({ ...prev, [po.id]: {} }));
    setReceiving(null);
    fetchAll();
  }

  const filtered = filter === "all" ? pos : pos.filter(p => p.status === filter);

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Purchase Orders</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Raise POs to suppliers, receive stock, and auto-update inventory.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#006A38] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#00522B] transition-colors"
        >
          + New Purchase Order
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "sent", "partial", "received", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg border capitalize transition-colors ${
              filter === s ? "bg-[#006A38] text-white border-[#006A38]" : "bg-white border-[#E0E0E0] text-[#9E9E9E] hover:text-[#212121]"
            }`}>
            {(() => { const I = STATUS_ICONS[s]; return I ? <I size={12} weight="regular" className="inline-block mr-1" /> : null; })()}{s} {s !== "all" && `(${pos.filter(p => p.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Create PO modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#212121]">New Purchase Order</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#9E9E9E] hover:text-[#212121] text-xl">✕</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">Supplier *</label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">Expected By</label>
                <input type="date" value={expectedAt} onChange={e => setExpectedAt(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">Note</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#006A38]"
                placeholder="Optional note to supplier…" />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#9E9E9E]">Items *</label>
                <button onClick={() => setPoItems(prev => [...prev, { sku: "", qty: "", cost: "" }])}
                  className="text-xs text-[#006A38] font-bold hover:underline">+ Add row</button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-[#9E9E9E] px-1">
                  <span className="col-span-5">SKU</span>
                  <span className="col-span-3">Qty</span>
                  <span className="col-span-3">Unit Cost ₹</span>
                  <span className="col-span-1" />
                </div>
                {poItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <select value={item.sku} onChange={e => setPoItems(prev => prev.map((p, j) => j === i ? { ...p, sku: e.target.value } : p))}
                        className="w-full border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#006A38]">
                        <option value="">Select SKU…</option>
                        {variants.map(v => (
                          <option key={v.id} value={v.sku}>{v.sku} — {v.product.title} ({v.size})</option>
                        ))}
                      </select>
                    </div>
                    <input type="number" min="1" value={item.qty}
                      onChange={e => setPoItems(prev => prev.map((p, j) => j === i ? { ...p, qty: e.target.value } : p))}
                      placeholder="100"
                      className="col-span-3 border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#006A38]" />
                    <input type="number" step="0.01" min="0" value={item.cost}
                      onChange={e => setPoItems(prev => prev.map((p, j) => j === i ? { ...p, cost: e.target.value } : p))}
                      placeholder="80.00"
                      className="col-span-3 border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#006A38]" />
                    <button onClick={() => setPoItems(prev => prev.filter((_, j) => j !== i))}
                      className="col-span-1 text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={createPO} disabled={creating || !supplierId || poItems.every(i => !i.sku)}
                className="bg-[#006A38] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60">
                {creating ? "Creating…" : "Create PO"}
              </button>
              <button onClick={() => setShowCreate(false)} className="text-sm text-[#9E9E9E] hover:text-[#212121] px-4">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO list */}
      {loading ? (
        <div className="text-center py-16 text-[#9E9E9E] text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] py-16 text-center">
          <ClipboardText size={32} weight="regular" className="text-[#9E9E9E] mx-auto mb-2" />
          <p className="font-bold text-[#212121]">No {filter !== "all" ? filter : ""} purchase orders yet.</p>
          <p className="text-sm text-[#9E9E9E] mt-1">Create a PO to order stock from a supplier.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(po => (
            <div key={po.id} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm">
              {/* Header row */}
              <div className="flex items-center justify-between p-5 flex-wrap gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="font-mono font-bold text-[#006A38] text-sm">PO-{po.id.slice(0, 8).toUpperCase()}</p>
                    <p className="font-semibold text-[#212121]">{po.supplier.name}</p>
                    <p className="text-xs text-[#9E9E9E]">
                      {new Date(po.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      {po.expectedAt && ` · Expected ${new Date(po.expectedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[po.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {(() => { const I = STATUS_ICONS[po.status]; return I ? <I size={12} weight="regular" className="inline-block mr-1" /> : null; })()}{po.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9E9E9E]">{po.items.length} item{po.items.length !== 1 ? "s" : ""}</span>
                  <button
                    onClick={() => setExpanded(expanded === po.id ? null : po.id)}
                    className="text-xs font-bold text-[#006A38] hover:underline"
                  >
                    {expanded === po.id ? "Hide" : "View"} details
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === po.id && (
                <div className="border-t border-[#F5F5F5] p-5 space-y-4">
                  {po.note && <p className="text-sm text-[#424242] italic">"{po.note}"</p>}

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase text-[#9E9E9E] tracking-wider">
                        <th className="text-left py-2">SKU</th>
                        <th className="text-right py-2">Ordered</th>
                        <th className="text-right py-2">Received</th>
                        <th className="text-right py-2">Unit Cost</th>
                        {["draft", "sent", "partial"].includes(po.status) && (
                          <th className="text-right py-2">Receive Now</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F9F9F9]">
                      {po.items.map(item => (
                        <tr key={item.id}>
                          <td className="py-2 font-mono text-xs text-[#424242]">{item.sku}</td>
                          <td className="py-2 text-right font-medium">{item.quantityOrdered}</td>
                          <td className={`py-2 text-right font-bold ${item.quantityReceived >= item.quantityOrdered ? "text-green-600" : item.quantityReceived > 0 ? "text-amber-600" : "text-[#9E9E9E]"}`}>
                            {item.quantityReceived}
                          </td>
                          <td className="py-2 text-right text-[#9E9E9E] text-xs">
                            {item.unitCost ? `₹${Number(item.unitCost).toFixed(2)}` : "—"}
                          </td>
                          {["draft", "sent", "partial"].includes(po.status) && (
                            <td className="py-2 text-right">
                              <input
                                type="number" min="0"
                                max={item.quantityOrdered - item.quantityReceived}
                                value={receiveMap[po.id]?.[item.id] ?? ""}
                                onChange={e => setReceiveMap(prev => ({
                                  ...prev,
                                  [po.id]: { ...prev[po.id], [item.id]: e.target.value }
                                }))}
                                placeholder="0"
                                className="w-20 border border-[#E0E0E0] rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-[#006A38]"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex gap-2 flex-wrap pt-1">
                    {["draft", "sent", "partial"].includes(po.status) && (
                      <button
                        onClick={() => receivePO(po)}
                        disabled={receiving === po.id || !Object.values(receiveMap[po.id] ?? {}).some(v => parseInt(v, 10) > 0)}
                        className="bg-[#006A38] text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-50"
                      >
                        {receiving === po.id ? "Updating stock…" : <><ArrowCircleDown size={14} weight="regular" className="inline-block mr-1" />Receive & Update Stock</>}
                      </button>
                    )}
                    {po.status === "draft" && (
                      <button onClick={() => updateStatus(po.id, "sent")}
                        className="border border-[#006A38] text-[#006A38] font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#F0FAF4] transition-colors">
                        <PaperPlaneTilt size={14} weight="regular" className="inline-block mr-1" />Mark Sent
                      </button>
                    )}
                    {po.status !== "cancelled" && po.status !== "received" && (
                      <button onClick={() => updateStatus(po.id, "cancelled")}
                        className="border border-red-200 text-red-500 font-bold px-4 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors">
                        Cancel PO
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
