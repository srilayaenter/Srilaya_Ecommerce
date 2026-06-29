"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MfaSetupPage() {
  const [qrDataUrl, setQrDataUrl]   = useState("");
  const [secret,    setSecret]      = useState("");
  const [code,      setCode]        = useState("");
  const [loading,   setLoading]     = useState(false);
  const [loadingQr, setLoadingQr]   = useState(true);
  const [error,     setError]       = useState("");
  const [enabled,   setEnabled]     = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/mfa-setup")
      .then(r => r.json())
      .then(d => { setQrDataUrl(d.qrDataUrl); setSecret(d.secret); setLoadingQr(false); });
  }, []);

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/mfa-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      setEnabled(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Invalid code.");
    }
  }

  async function handleDisable() {
    if (!confirm("Disable two-factor authentication? Your account will be less secure.")) return;
    await fetch("/api/auth/mfa-setup", { method: "DELETE" });
    router.push("/admin/settings");
    router.refresh();
  }

  if (enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-sans">
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-10 text-center max-w-sm shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-black text-[#212121] mb-2">MFA Enabled!</h2>
          <p className="text-sm text-[#616161] mb-6">
            Two-factor authentication is now active. You'll be asked for a code each time you log in.
          </p>
          <button onClick={() => router.push("/admin")}
            className="bg-[#006A38] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#00522B] transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-black text-[#212121] mb-1">Set Up Two-Factor Authentication</h1>
      <p className="text-sm text-[#8D6E63] mb-8">
        Secure your account with an authenticator app like Google Authenticator or Authy.
      </p>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
          <p className="text-sm font-bold text-[#212121] mb-1">Step 1 — Scan this QR code</p>
          <p className="text-xs text-[#8D6E63] mb-4">Open your authenticator app and scan the QR code below.</p>
          {loadingQr ? (
            <div className="w-48 h-48 bg-[#F5F5F5] rounded-xl animate-pulse mx-auto" />
          ) : (
            <img src={qrDataUrl} alt="MFA QR Code" className="w-48 h-48 mx-auto border border-[#E0E0E0] rounded-xl" />
          )}
          {secret && (
            <div className="mt-4 bg-[#F5F5F5] rounded-lg px-4 py-2 text-center">
              <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider mb-1">Manual entry code</p>
              <p className="font-mono text-sm text-[#212121] tracking-widest break-all">{secret}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
          <p className="text-sm font-bold text-[#212121] mb-1">Step 2 — Verify the code</p>
          <p className="text-xs text-[#8D6E63] mb-4">Enter the 6-digit code from your app to confirm setup.</p>
          <form onSubmit={handleEnable} className="space-y-4">
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
              className="w-full border border-[#E0E0E0] rounded-lg px-4 py-3 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:border-[#006A38]"
            />
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-[#006A38] text-white font-bold py-3 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Enable MFA"}
            </button>
          </form>
        </div>

        <button onClick={handleDisable} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
          Disable MFA on my account →
        </button>
      </div>
    </div>
  );
}
