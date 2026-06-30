"use client";

import { useState } from "react";

interface PincodeResult {
  serviceable: boolean;
  state?: string;
  zone?: string;
  zoneLabel?: string;
  etaDays?: string;
  message?: string;
}

export default function PincodeCheck() {
  const [pin,     setPin]     = useState("");
  const [result,  setResult]  = useState<PincodeResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    const p = pin.trim();
    if (!/^\d{6}$/.test(p)) { setResult({ serviceable: false, message: "Enter a valid 6-digit pincode" }); return; }
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/pincode/${p}`).catch(() => null);
    const data = res?.ok ? await res.json() : { serviceable: false, message: "Unable to check. Try again." };
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-bold text-[#616161] uppercase tracking-wider mb-2">Check Delivery</p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setResult(null); }}
          onKeyDown={e => e.key === "Enter" && check()}
          placeholder="Enter pincode"
          className="flex-1 border border-[#E0E0E0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
        />
        <button
          onClick={check}
          disabled={loading || pin.length !== 6}
          className="bg-[#006A38] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#005A30] transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Check"}
        </button>
      </div>

      {result && (
        <div className={`mt-3 rounded-xl px-3 py-2.5 text-sm ${result.serviceable ? "bg-[#E8F5E9] text-[#006A38]" : "bg-red-50 text-red-600"}`}>
          {result.serviceable ? (
            <div>
              <p className="font-bold">✅ Delivery available to {result.state}</p>
              <p className="text-xs mt-0.5 opacity-80">Estimated delivery: {result.etaDays} · {result.zoneLabel}</p>
            </div>
          ) : (
            <p className="font-medium">❌ {result.message ?? "Not serviceable"}</p>
          )}
        </div>
      )}
    </div>
  );
}
