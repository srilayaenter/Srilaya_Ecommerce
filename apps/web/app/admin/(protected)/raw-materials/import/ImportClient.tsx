'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Material = { id: string; name: string; unit: string };

type MatchedLine = {
  name: string; qty: number; unit: string; price?: number;
  rawMaterialId: string; rawMaterialName: string;
};
type UnmatchedLine = { name: string; qty: number; unit: string; price?: number };
type ParseResult = { vendor: string; date: string; matched: MatchedLine[]; unmatched: UnmatchedLine[] };
type NewMaterial = { name: string; unit: string; costPerUnit: string; include: boolean };

// ── Manual entry line ───────────────────────────────────────────────────────
type ManualLine = {
  rawMaterialId: string;   // existing, or '__new__'
  newName: string;
  newUnit: string;
  newCost: string;
  qty: string;
};

export default function ImportClient({
  aiEnabled,
  materials,
}: {
  aiEnabled: boolean;
  materials: Material[];
}) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'manual'>(aiEnabled ? 'upload' : 'manual');

  // ── AI upload state ───────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ParseResult | null>(null);
  const [error, setError]       = useState('');
  const [vendor, setVendor]     = useState('');
  const [billRef, setBillRef]   = useState('');
  const [billDate, setBillDate] = useState('');
  const [matchedQty, setMatchedQty]         = useState<Record<string, number>>({});
  const [matchedInclude, setMatchedInclude] = useState<Record<string, boolean>>({});
  const [newMaterials, setNewMaterials]     = useState<Record<number, NewMaterial>>({});

  // ── Manual entry state ────────────────────────────────────────────────────
  const [manualVendor, setManualVendor]   = useState('');
  const [manualRef, setManualRef]         = useState('');
  const [manualDate, setManualDate]       = useState('');
  const emptyLine = (): ManualLine => ({
    rawMaterialId: materials[0]?.id ?? '',
    newName: '', newUnit: 'kg', newCost: '', qty: '',
  });
  const [manualLines, setManualLines] = useState<ManualLine[]>([emptyLine()]);

  // ── Shared ────────────────────────────────────────────────────────────────
  const [importing, setImporting] = useState(false);
  const [done, setDone]           = useState(false);

  // ── AI handlers ───────────────────────────────────────────────────────────
  async function handleFile(file: File) {
    setLoading(true); setError(''); setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res  = await fetch('/api/admin/parse-purchase-bill', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Parse failed');
      setResult(data);
      setVendor(data.vendor ?? '');
      setBillDate(data.date ?? '');
      const qMap: Record<string, number>  = {};
      const iMap: Record<string, boolean> = {};
      for (const l of data.matched) { qMap[l.rawMaterialId] = l.qty; iMap[l.rawMaterialId] = true; }
      setMatchedQty(qMap); setMatchedInclude(iMap);
      const nm: Record<number, NewMaterial> = {};
      data.unmatched.forEach((u: UnmatchedLine, i: number) => {
        nm[i] = { name: u.name, unit: u.unit ?? 'kg', costPerUnit: u.price ? String(u.price) : '', include: true };
      });
      setNewMaterials(nm);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }

  // ── Confirm (AI path) ─────────────────────────────────────────────────────
  async function confirmAI() {
    if (!result) return;
    setImporting(true);
    const lines: any[] = [];
    for (const l of result.matched) {
      if (!matchedInclude[l.rawMaterialId]) continue;
      lines.push({ rawMaterialId: l.rawMaterialId, qty: matchedQty[l.rawMaterialId] ?? l.qty });
    }
    for (const [idx, nm] of Object.entries(newMaterials)) {
      if (!nm.include || !nm.name.trim()) continue;
      const u = result.unmatched[Number(idx)];
      lines.push({ newName: nm.name.trim(), newUnit: nm.unit, newCostPerUnit: nm.costPerUnit ? parseFloat(nm.costPerUnit) : undefined, qty: u.qty });
    }
    await submit(lines, vendor, billRef, billDate);
  }

  // ── Confirm (manual path) ─────────────────────────────────────────────────
  async function confirmManual() {
    setImporting(true);
    const lines: any[] = manualLines
      .filter(l => parseFloat(l.qty) > 0)
      .map(l => l.rawMaterialId === '__new__'
        ? { newName: l.newName.trim(), newUnit: l.newUnit, newCostPerUnit: l.newCost ? parseFloat(l.newCost) : undefined, qty: parseFloat(l.qty) }
        : { rawMaterialId: l.rawMaterialId, qty: parseFloat(l.qty) }
      );
    await submit(lines, manualVendor, manualRef, manualDate);
  }

  async function submit(lines: any[], v: string, ref: string, date: string) {
    try {
      const res = await fetch('/api/admin/import-purchase-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines, vendor: v, billRef: ref, billDate: date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      setDone(true);
      setTimeout(() => router.push('/admin/raw-materials'), 1800);
    } catch (e: any) { setError(e.message); }
    finally { setImporting(false); }
  }

  function updateManualLine(i: number, key: keyof ManualLine, val: string) {
    setManualLines(p => p.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  }

  if (done) return (
    <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-8 py-16 text-center">
      <p className="text-4xl mb-3">✅</p>
      <p className="font-bold text-lg">Stock updated successfully!</p>
      <p className="text-sm mt-1 opacity-70">Redirecting to Raw Materials...</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Mode toggle */}
      {aiEnabled && (
        <div className="flex gap-1 bg-[#F5F5F5] p-1 rounded-xl w-fit">
          {(['upload', 'manual'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                mode === m ? 'bg-white shadow text-[#212121]' : 'text-[#9E9E9E] hover:text-[#424242]'
              }`}>
              {m === 'upload' ? '📄 Scan Bill (AI)' : '✏️ Enter Manually'}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {/* ── AI UPLOAD MODE ── */}
      {mode === 'upload' && !result && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors
            ${dragging ? 'border-[#006A38] bg-green-50' : 'border-[#E0E0E0] hover:border-[#006A38] hover:bg-[#FAFAFA]'}`}
        >
          <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <p className="text-5xl mb-4">🧾</p>
          {loading ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#006A38] animate-pulse">AI is reading your bill...</p>
              <p className="text-xs text-[#9E9E9E]">Extracting vendor, items and quantities</p>
            </div>
          ) : (
            <>
              <p className="font-bold text-[#212121] text-lg">Drop your purchase bill here</p>
              <p className="text-sm text-[#9E9E9E] mt-2">PDF · photo · WhatsApp screenshot · any vendor · any format</p>
              <p className="text-xs text-[#BDBDBD] mt-1">or click to browse</p>
            </>
          )}
        </div>
      )}

      {/* AI result */}
      {mode === 'upload' && result && (
        <div className="space-y-5">
          {/* Bill metadata */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
            <h2 className="font-bold text-[#212121] mb-4">Bill Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Vendor</label>
                <input value={vendor} onChange={e => setVendor(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Bill / Invoice Ref</label>
                <input value={billRef} onChange={e => setBillRef(e.target.value)} placeholder="e.g. INV-001"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Bill Date</label>
                <input value={billDate} onChange={e => setBillDate(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
            </div>
          </div>

          {/* Matched */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <h2 className="font-bold text-green-800">✅ Recognised — {result.matched.length} items</h2>
            </div>
            {result.matched.length === 0
              ? <p className="text-sm text-[#9E9E9E] px-6 py-8 text-center">No items matched existing raw materials.</p>
              : <table className="w-full text-sm">
                  <thead className="bg-[#F5F5F5] text-[11px] uppercase font-bold text-[#9E9E9E] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3 text-left">Bill Item</th>
                      <th className="px-4 py-3 text-left">Raw Material</th>
                      <th className="px-4 py-3 text-right">Qty (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F5]">
                    {result.matched.map(l => (
                      <tr key={l.rawMaterialId} className={!matchedInclude[l.rawMaterialId] ? 'opacity-40' : ''}>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" checked={matchedInclude[l.rawMaterialId] ?? true}
                            onChange={e => setMatchedInclude(p => ({ ...p, [l.rawMaterialId]: e.target.checked }))}
                            className="accent-[#006A38]" />
                        </td>
                        <td className="px-4 py-3 text-[#424242]">{l.name}</td>
                        <td className="px-4 py-3 font-semibold text-[#212121]">{l.rawMaterialName}</td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" step="0.001" min="0"
                            value={matchedQty[l.rawMaterialId] ?? l.qty}
                            onChange={e => setMatchedQty(p => ({ ...p, [l.rawMaterialId]: parseFloat(e.target.value) || 0 }))}
                            className="w-24 border border-[#E0E0E0] rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-[#006A38]" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>

          {/* New items */}
          {result.unmatched.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
                <h2 className="font-bold text-amber-800">🆕 New Items — {result.unmatched.length}</h2>
                <p className="text-xs text-amber-600 mt-0.5">These will be created as new raw materials.</p>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {result.unmatched.map((u, i) => {
                  const nm = newMaterials[i] ?? { name: u.name, unit: 'kg', costPerUnit: '', include: true };
                  return (
                    <div key={i} className={`px-5 py-4 ${!nm.include ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={nm.include}
                          onChange={e => setNewMaterials(p => ({ ...p, [i]: { ...p[i], include: e.target.checked } }))}
                          className="accent-[#006A38]" />
                        <input value={nm.name}
                          onChange={e => setNewMaterials(p => ({ ...p, [i]: { ...p[i], name: e.target.value } }))}
                          className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
                        <select value={nm.unit}
                          onChange={e => setNewMaterials(p => ({ ...p, [i]: { ...p[i], unit: e.target.value } }))}
                          className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="litre">litre</option>
                          <option value="nos">nos</option>
                        </select>
                        <input type="number" step="0.01" value={nm.costPerUnit} placeholder="₹/unit"
                          onChange={e => setNewMaterials(p => ({ ...p, [i]: { ...p[i], costPerUnit: e.target.value } }))}
                          className="w-28 border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
                        <span className="font-mono font-bold text-[#006A38] text-sm w-20 text-right">{u.qty.toFixed(3)} kg</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setResult(null); setError(''); }}
              className="px-5 py-2.5 border border-[#E0E0E0] rounded-xl text-sm text-[#424242] hover:bg-[#F5F5F5]">
              Upload different bill
            </button>
            <button onClick={confirmAI} disabled={importing}
              className="flex-1 bg-[#006A38] text-white font-bold py-2.5 rounded-xl hover:bg-[#00522B] disabled:opacity-50 text-sm">
              {importing ? 'Saving...' : 'Confirm & Update Stock'}
            </button>
          </div>
        </div>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === 'manual' && (
        <div className="space-y-5">
          {/* Bill metadata */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
            <h2 className="font-bold text-[#212121] mb-4">Bill Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Vendor / Supplier</label>
                <input value={manualVendor} onChange={e => setManualVendor(e.target.value)}
                  placeholder="e.g. Evenmore, Local market"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Bill / Invoice Ref</label>
                <input value={manualRef} onChange={e => setManualRef(e.target.value)} placeholder="e.g. INV-001"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Bill Date</label>
                <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F0F0]">
              <h2 className="font-bold text-[#212121]">Items Purchased</h2>
            </div>
            <div className="divide-y divide-[#F5F5F5]">
              {manualLines.map((line, i) => (
                <div key={i} className="px-5 py-4 flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Material</label>
                    <select value={line.rawMaterialId}
                      onChange={e => updateManualLine(i, 'rawMaterialId', e.target.value)}
                      className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                      <option value="__new__">+ New material...</option>
                    </select>
                  </div>

                  {line.rawMaterialId === '__new__' && (
                    <>
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">New Name</label>
                        <input value={line.newName} onChange={e => updateManualLine(i, 'newName', e.target.value)}
                          placeholder="e.g. Groundnut"
                          className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Unit</label>
                        <select value={line.newUnit} onChange={e => updateManualLine(i, 'newUnit', e.target.value)}
                          className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="litre">litre</option>
                          <option value="nos">nos</option>
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Cost/unit ₹</label>
                        <input type="number" step="0.01" value={line.newCost}
                          onChange={e => updateManualLine(i, 'newCost', e.target.value)}
                          className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
                      </div>
                    </>
                  )}

                  <div className="w-28">
                    <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Qty purchased</label>
                    <input type="number" step="0.001" min="0" value={line.qty}
                      onChange={e => updateManualLine(i, 'qty', e.target.value)}
                      placeholder="0.000"
                      className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
                  </div>

                  {manualLines.length > 1 && (
                    <button type="button"
                      onClick={() => setManualLines(p => p.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600 text-xl pb-1.5">×</button>
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#F0F0F0]">
              <button onClick={() => setManualLines(p => [...p, emptyLine()])}
                className="text-sm text-[#006A38] font-bold hover:underline">+ Add another item</button>
            </div>
          </div>

          <button onClick={confirmManual} disabled={importing}
            className="w-full bg-[#006A38] text-white font-bold py-3 rounded-xl hover:bg-[#00522B] disabled:opacity-50 text-sm">
            {importing ? 'Saving...' : 'Confirm & Update Stock'}
          </button>
        </div>
      )}
    </div>
  );
}
