"use client";

import { useState } from "react";
import { REFERRAL_BONUS } from "@/lib/loyaltyConstants";

export default function ReferralPage() {
  const [email,   setEmail]   = useState("");
  const [data,    setData]    = useState<{ referralCode: string | null; balance: number; totalEarned: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setData(null);
    const res = await fetch(`/api/referral?email=${encodeURIComponent(email.trim())}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  function copyCode() {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const storeUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-[#F9F6F0] py-14 px-4">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">🎁</div>
          <h1 className="text-3xl font-black text-[#212121]">Refer & Earn</h1>
          <p className="text-[#757575] mt-2 text-sm leading-relaxed">
            Share your referral code with friends. When they place their first order,
            you both get <strong>{REFERRAL_BONUS} loyalty points</strong> (worth ₹{(REFERRAL_BONUS * 0.1).toFixed(0)})!
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6">
          <h2 className="font-bold text-[#212121] mb-4">How it works</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: "Enter your order email below to get your referral code" },
              { step: "2", text: "Share your code with friends and family" },
              { step: "3", text: `Friend enters your code at checkout on their first order` },
              { step: "4", text: `You both get ${REFERRAL_BONUS} points = ₹${(REFERRAL_BONUS * 0.1).toFixed(0)} off your next order` },
            ].map(item => (
              <div key={item.step} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-[#006A38] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <p className="text-sm text-[#424242]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Email lookup */}
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6">
          <h2 className="font-bold text-[#212121] mb-4">Get Your Referral Code</h2>
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Email used at checkout"
              className="flex-1 border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#006A38] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#005A30] transition-colors disabled:opacity-50"
            >
              {loading ? "…" : "Lookup"}
            </button>
          </form>

          {data && (
            <div className="mt-5 space-y-4">
              {data.referralCode ? (
                <>
                  <div>
                    <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">Your Referral Code</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl px-5 py-3 text-center">
                        <span className="text-2xl font-black text-[#006A38] tracking-widest">{data.referralCode}</span>
                      </div>
                      <button
                        onClick={copyCode}
                        className="border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm font-bold text-[#006A38] hover:bg-[#F5F5F5] transition-colors"
                      >
                        {copied ? "✅ Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Hey! Use my referral code *${data.referralCode}* on SriLaYa Enterprises and get ₹${(REFERRAL_BONUS * 0.1).toFixed(0)} off your first order! Shop here: ${storeUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#25D366] text-white font-bold text-sm py-2.5 rounded-xl text-center hover:bg-[#1da851] transition-colors"
                    >
                      Share on WhatsApp
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F0F0F0]">
                    <div className="text-center">
                      <p className="text-xl font-black text-[#006A38]">{data.balance}</p>
                      <p className="text-xs text-[#9E9E9E] mt-0.5">Points balance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-[#212121]">{data.totalEarned}</p>
                      <p className="text-xs text-[#9E9E9E] mt-0.5">Total earned</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-[#9E9E9E]">
                  <p className="text-sm">No account found for this email.</p>
                  <p className="text-xs mt-1">Place your first order to get a referral code!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
