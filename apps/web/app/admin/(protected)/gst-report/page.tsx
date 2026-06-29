"use client";

import { useState } from "react";

interface GstSlab {
  rate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  orderCount: number;
}

interface GstReport {
  month: number;
  year: number;
  gstin: string;
  slabs: GstSlab[];
  grandTaxable: number;
  grandCgst: number;
  grandSgst: number;
  grandIgst: number;
  grandTax: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  orderCount: number;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function GstReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [report, setReport] = useState<GstReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function fetchReport() {
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch(`/api/admin/gst-report?month=${month}&year=${year}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      setReport(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadCsv() {
    const res = await fetch(`/api/admin/gst-report?month=${month}&year=${year}&format=csv`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `GST_Report_${MONTHS[month-1]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#212121] font-poppins">GST Report</h1>
          <p className="text-sm text-[#757575] mt-0.5">Monthly tax summary for GSTR-1 filing</p>
        </div>
        {report && (
          <button
            onClick={downloadCsv}
            className="flex items-center gap-2 bg-[#006A38] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#005A30] transition-colors"
          >
            ⬇ Download CSV
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5 flex items-end gap-4">
        <div>
          <label className="block text-xs font-bold text-[#757575] uppercase tracking-wider mb-1.5">Month</label>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#006A38]/30 bg-white"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#757575] uppercase tracking-wider mb-1.5">Year</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#212121] focus:outline-none focus:ring-2 focus:ring-[#006A38]/30 bg-white"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="bg-[#006A38] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#005A30] transition-colors disabled:opacity-60"
        >
          {loading ? "Loading…" : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Orders",     value: report.orderCount.toString(),           color: "#006A38" },
              { label: "Taxable Sales",    value: `₹${report.grandTaxable.toFixed(2)}`,  color: "#1565C0" },
              { label: "Total GST",        value: `₹${report.grandTax.toFixed(2)}`,      color: "#6A1B9A" },
              { label: "Gross Revenue",    value: `₹${report.grandTotal.toFixed(2)}`,    color: "#E65100" },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
                <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-2xl font-black" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* GST slab table */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
              <h2 className="font-black text-[#212121] text-lg">
                GST Slab Breakdown — {MONTHS[report.month - 1]} {report.year}
              </h2>
              {report.gstin && (
                <span className="text-xs font-bold text-[#757575] bg-[#F5F5F5] px-3 py-1 rounded-full">
                  GSTIN: {report.gstin}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F5F5] text-[#757575] text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">GST Rate</th>
                    <th className="px-6 py-3 text-right">Taxable Value</th>
                    <th className="px-6 py-3 text-right">CGST</th>
                    <th className="px-6 py-3 text-right">SGST</th>
                    <th className="px-6 py-3 text-right">IGST</th>
                    <th className="px-6 py-3 text-right">Total Tax</th>
                    <th className="px-6 py-3 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {report.slabs.map(slab => (
                    <tr key={slab.rate} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#212121]">
                        <span className="bg-[#E8F5E9] text-[#006A38] px-2.5 py-1 rounded-full text-xs font-black">
                          {slab.rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#212121]">₹{slab.taxableValue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-[#424242]">₹{slab.cgst.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-[#424242]">₹{slab.sgst.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-[#424242]">₹{slab.igst.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#6A1B9A]">₹{slab.totalTax.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-[#757575]">{slab.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#E8F5E9] font-black text-[#212121]">
                    <td className="px-6 py-4">TOTAL</td>
                    <td className="px-6 py-4 text-right">₹{report.grandTaxable.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">₹{report.grandCgst.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">₹{report.grandSgst.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">₹{report.grandIgst.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[#6A1B9A]">₹{report.grandTax.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">{report.orderCount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional breakdown */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6">
            <h2 className="font-black text-[#212121] text-lg mb-4">Revenue Reconciliation</h2>
            <div className="space-y-2 max-w-sm">
              {[
                { label: "Taxable Sales",    value: report.grandTaxable, color: "text-[#212121]" },
                { label: "Total GST",        value: report.grandTax,     color: "text-[#6A1B9A]" },
                { label: "Shipping Fees",    value: report.shippingFee,  color: "text-[#212121]" },
                { label: "Discounts Given",  value: -report.discount,    color: "text-red-600" },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b border-[#F0F0F0]">
                  <span className="text-sm text-[#424242] font-medium">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>
                    {row.value < 0 ? "-" : ""}₹{Math.abs(row.value).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-3">
                <span className="font-black text-[#212121]">Gross Collection</span>
                <span className="font-black text-[#006A38] text-lg">₹{report.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#9E9E9E]">
            * CGST & SGST apply to intra-state orders (same state as GSTIN). IGST applies to inter-state orders.
            Only paid and COD-collected orders are included.
          </p>
        </div>
      )}

      {!report && !loading && !error && (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-[#424242] font-semibold">Select a month and year, then click Generate Report.</p>
          <p className="text-sm text-[#9E9E9E] mt-1">Only paid & COD-collected orders are included.</p>
        </div>
      )}
    </div>
  );
}
