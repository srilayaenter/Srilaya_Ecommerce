"use client";

import { Printer } from "@phosphor-icons/react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-white text-[#006A38] font-bold text-sm px-5 py-2 rounded-xl hover:bg-[#FFF8E1] transition-colors inline-flex items-center gap-1.5"
    >
      <Printer size={15} weight="regular" /> Print / Save as PDF
    </button>
  );
}
