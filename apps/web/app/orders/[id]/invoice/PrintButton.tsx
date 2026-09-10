'use client';

export default function PrintButton() {
  return (
    <div className="mt-8 text-center no-print">
      <button
        onClick={() => window.print()}
        className="bg-naturals-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-800"
      >
        Print Invoice
      </button>
    </div>
  );
}