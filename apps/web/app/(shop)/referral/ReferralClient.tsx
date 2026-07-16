"use client";

import { useState } from "react";
import Link from "next/link";
import { REFERRAL_BONUS } from "@/lib/loyaltyConstants";

type ReferralData = { referralCode: string; balance: number; totalEarned: number };

interface Props {
  prefilled: ReferralData | null;
  isLoggedIn: boolean;
}

export default function ReferralClient({ prefilled, isLoggedIn }: Props) {
  const [email,   setEmail]   = useState("");
  const [data,    setData]    = useState<ReferralData | null>(prefilled);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setData(null);
    setNotFound(false);
    const res  = await fetch(`/api/referral?email=${encodeURIComponent(email.trim())}`);
    const json = await res.json();
    setLoading(false);
    if (json.referralCode) {
      setData(json);
    } else {
      setNotFound(true);
    }
  }

  function copyCode() {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const storeUrl = typeof window !== "undefined" ? window.location.origin : "https://srilayafoods.com";

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

        {/* Code card — shown immediately if logged in */}
        {data ? (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-5">
            {isLoggedIn && prefilled && (
              <p className="text-xs font-semibold text-[#006A38] uppercase tracking-wider">Your referral code</p>
            )}

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

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Hey! Use my referral code *${data.referralCode}* on SriLaYa Naturals and get ₹${(REFERRAL_BONUS * 0.1).toFixed(0)} off your first order! Shop here: ${storeUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#25D366] text-white font-bold text-sm py-2.5 rounded-xl text-center hover:bg-[#1da851] transition-colors"
            >
              Share on WhatsApp
            </a>

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

            <div className="text-center pt-1">
              <Link href="/loyalty" className="text-xs text-[#006A38] font-semibold hover:underline">
                View full loyalty dashboard →
              </Link>
            </div>
          </div>
        ) : (
          /* Email lookup — shown for guests, or logged-in users with no orders yet */
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6">
            {isLoggedIn ? (
              <div className="text-center py-4 text-[#9E9E9E] mb-4">
                <p className="text-sm">Place your first order to receive a referral code.</p>
                <Link href="/product" className="text-[#006A38] font-semibold text-sm hover:underline mt-1 inline-block">
                  Shop now →
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 bg-[#e8f5ee] rounded-xl p-4 mb-5">
                  <span className="text-lg">💡</span>
                  <p className="text-sm text-[#065F46]">
                    <Link href="/login" className="font-bold underline">Sign in</Link> to see your referral code instantly — no email lookup needed.
                  </p>
                </div>
                <h2 className="font-bold text-[#212121] mb-4">Look up by order email</h2>
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
                {notFound && (
                  <p className="text-sm text-[#9E9E9E] mt-3 text-center">
                    No account found. Place your first order to get a referral code!
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6">
          <h2 className="font-bold text-[#212121] mb-4">How it works</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: isLoggedIn ? "Copy your referral code above" : "Get your referral code by signing in or entering your order email" },
              { step: "2", text: "Share your code with friends and family" },
              { step: "3", text: "Friend enters your code at checkout on their first order" },
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

      </div>
    </div>
  );
}
