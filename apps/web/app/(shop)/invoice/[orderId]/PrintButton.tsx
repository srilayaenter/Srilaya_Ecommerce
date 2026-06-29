"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-white text-[#006A38] font-bold text-sm px-5 py-2 rounded-xl hover:bg-[#FFF8E1] transition-colors"
    >
      🖨️ Print / Save as PDF
    </button>
  );
}
