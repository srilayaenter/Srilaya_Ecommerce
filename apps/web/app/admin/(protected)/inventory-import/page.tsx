"use client";

import { useState, useRef } from "react";

interface ImportResult {
  updated: number;
  skipped: number;
  notFound: string[];
}

export default function InventoryImportPage() {
  const [csvText, setCsvText]   = useState("");
  const [result,  setResult]    = useState<ImportResult | null>(null);
  const [error,   setError]     = useState("");
  const [loading, setLoading]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!csvText.trim()) { setError("Paste CSV or upload a file first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/admin/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: csvText,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Import failed."); return; }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const csv = "sku,stock,price,reorderThreshold\nPROD-SKU-500G,100,199.00,10\nPROD-SKU-1KG,50,349.00,5";
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "inventory_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-[#212121] font-poppins">Inventory Bulk Import</h1>
        <p className="text-sm text-[#757575] mt-0.5">Update stock, price, and reorder thresholds for multiple variants at once via CSV.</p>
      </div>

      {/* Instructions */}
      <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-5 space-y-2">
        <p className="font-bold text-[#E65100] text-sm">CSV Format</p>
        <p className="text-sm text-[#424242]">Required columns: <code className="bg-white px-1 py-0.5 rounded text-xs border border-[#E0E0E0]">sku</code>, <code className="bg-white px-1 py-0.5 rounded text-xs border border-[#E0E0E0]">stock</code></p>
        <p className="text-sm text-[#424242]">Optional columns: <code className="bg-white px-1 py-0.5 rounded text-xs border border-[#E0E0E0]">price</code>, <code className="bg-white px-1 py-0.5 rounded text-xs border border-[#E0E0E0]">reorderThreshold</code></p>
        <p className="text-sm text-[#424242]">SKU must match exactly what's in the system. Unknown SKUs are skipped.</p>
        <p className="text-sm text-[#424242]">Variants restocked from 0 will automatically trigger notify-when-in-stock emails.</p>
        <button onClick={downloadTemplate} className="text-sm font-bold text-[#006A38] underline underline-offset-2 mt-1">
          ⬇ Download Template CSV
        </button>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-[#F5F5F5] border border-[#E0E0E0] text-[#424242] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#EEEEEE] transition-colors"
          >
            📂 Upload CSV File
          </button>
          <span className="text-sm text-[#9E9E9E]">or paste CSV below</span>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
        </div>

        <textarea
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          placeholder={"sku,stock,price,reorderThreshold\nPROD-001-500G,100,199.00,10"}
          rows={10}
          className="w-full font-mono text-xs border border-[#E0E0E0] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#006A38]/30 resize-y"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={loading || !csvText.trim()}
          className="bg-[#006A38] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#005A30] transition-colors disabled:opacity-50 w-full"
        >
          {loading ? "Importing…" : "Import & Update Stock"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4">
          <h2 className="font-black text-[#212121]">Import Complete</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#E8F5E9] rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-[#006A38]">{result.updated}</p>
              <p className="text-xs font-bold text-[#006A38] mt-1">Variants Updated</p>
            </div>
            <div className="bg-[#FFF8E1] rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-[#E65100]">{result.skipped}</p>
              <p className="text-xs font-bold text-[#E65100] mt-1">Rows Skipped</p>
            </div>
            <div className="bg-[#F5F5F5] rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-[#757575]">{result.notFound.length}</p>
              <p className="text-xs font-bold text-[#757575] mt-1">SKUs Not Found</p>
            </div>
          </div>
          {result.notFound.length > 0 && (
            <div>
              <p className="text-sm font-bold text-[#757575] mb-2">Unknown SKUs (not updated):</p>
              <div className="flex flex-wrap gap-2">
                {result.notFound.map(sku => (
                  <span key={sku} className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] px-2 py-1 rounded-lg font-mono text-[#424242]">
                    {sku}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
