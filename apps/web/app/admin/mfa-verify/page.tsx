"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MfaVerifyPage() {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/mfa-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Invalid code.");
      setCode("");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans pb-20 mt-12">
      <div className="text-center mb-8">
        <h1 className="text-[32px] font-black text-[#212121] tracking-tight">
          SriLaYa <span className="text-[#006A38]">Foods</span>
        </h1>
        <p className="text-[#8D6E63] font-bold tracking-wide mt-1 uppercase text-[12px]">
          Two-Factor Verification
        </p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">🔐</span>
          <p className="text-sm text-[#616161] mt-3">
            Open your authenticator app and enter the 6-digit code for <strong>SriLaYa Admin</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            required
            autoFocus
            className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38]"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-[#006A38] text-white py-3 rounded-[8px] font-bold text-[15px] hover:bg-[#00522B] transition-all disabled:opacity-70"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
