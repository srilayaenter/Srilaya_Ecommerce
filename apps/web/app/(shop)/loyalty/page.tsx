"use client";

import { useState } from "react";
import Link from "next/link";

const POINTS_PER_RUPEE = 0.1;   // 1 point per ₹10 spent
const RUPEES_PER_POINT = 0.1;   // 10 points = ₹1 off
const MIN_REDEEM = 100;          // minimum to redeem
const REFERRAL_BONUS = 50;       // points for referral

export default function LoyaltyPage() {
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    setBalance(null);
    try {
      const res = await fetch(`/api/loyalty/balance?email=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setBalance(data.balance ?? 0);
    } catch {
      setError("Could not fetch balance. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const rupeeValue = balance !== null ? (balance * RUPEES_PER_POINT).toFixed(2) : null;
  const canRedeem = balance !== null && balance >= MIN_REDEEM;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-3xl font-bold text-[#212121] mb-2">SriLaYa Rewards</h1>
        <p className="text-gray-500">Earn points on every order. Redeem for discounts at checkout.</p>
      </div>

      {/* Balance lookup */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="font-bold text-lg text-[#212121] mb-4">Check Your Points Balance</h2>
        <form onSubmit={handleLookup} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="Enter your order email"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006A38] focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#006A38] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60"
          >
            {loading ? "Checking…" : "Check"}
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        {balance !== null && (
          <div className="mt-5 rounded-xl bg-[#f0fdf4] border border-[#d1fae5] p-5">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-4xl font-black text-[#006A38]">{balance}</span>
              <span className="text-lg font-semibold text-[#006A38]">points</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Worth <span className="font-semibold text-[#006A38]">₹{rupeeValue}</span> off your next order
            </p>
            {canRedeem ? (
              <div className="flex items-center gap-2 text-sm text-[#065F46] font-medium">
                <span className="text-base">✅</span>
                Ready to redeem — enter your email at checkout to apply your points.
              </div>
            ) : balance === 0 ? (
              <p className="text-sm text-gray-500">Place your first order to start earning points!</p>
            ) : (
              <p className="text-sm text-gray-500">
                Earn <span className="font-semibold">{MIN_REDEEM - balance} more points</span> (spend ₹{((MIN_REDEEM - balance) / POINTS_PER_RUPEE).toFixed(0)}) to unlock redemption.
              </p>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="font-bold text-lg text-[#212121] mb-5">How It Works</h2>

        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-full bg-[#e8f5ee] flex items-center justify-center flex-shrink-0 text-[#006A38] font-bold">1</div>
            <div>
              <p className="font-semibold text-[#212121]">Shop & earn points</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Earn <strong>1 point for every ₹10</strong> spent on any order. Points are credited after your order is confirmed.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-full bg-[#e8f5ee] flex items-center justify-center flex-shrink-0 text-[#006A38] font-bold">2</div>
            <div>
              <p className="font-semibold text-[#212121]">Reach 100 points</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Once you have at least <strong>{MIN_REDEEM} points</strong> (= ₹{(MIN_REDEEM * RUPEES_PER_POINT).toFixed(0)} value), you can redeem them at checkout.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-9 h-9 rounded-full bg-[#e8f5ee] flex items-center justify-center flex-shrink-0 text-[#006A38] font-bold">3</div>
            <div>
              <p className="font-semibold text-[#212121]">Redeem at checkout</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Enter your email at checkout and choose how many points to apply. Points can cover up to <strong>10% of your order value</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Earning opportunities */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="font-bold text-lg text-[#212121] mb-5">Ways to Earn</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#f0fdf4] rounded-xl p-4">
            <p className="text-2xl mb-1">🛒</p>
            <p className="font-semibold text-[#212121] text-sm">Every purchase</p>
            <p className="text-[#006A38] font-black text-lg">1 pt / ₹10</p>
            <p className="text-xs text-gray-500 mt-1">Automatic on every confirmed order</p>
          </div>
          <div className="bg-[#f0fdf4] rounded-xl p-4">
            <p className="text-2xl mb-1">🎁</p>
            <p className="font-semibold text-[#212121] text-sm">Refer a friend</p>
            <p className="text-[#006A38] font-black text-lg">{REFERRAL_BONUS} pts</p>
            <p className="text-xs text-gray-500 mt-1">You and your friend both get 50 points when they place their first order</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/referral"
            className="inline-block text-[#006A38] font-semibold text-sm border border-[#006A38] rounded-lg px-4 py-2 hover:bg-[#e8f5ee] transition-colors"
          >
            Get your referral code →
          </Link>
        </div>
      </div>

      {/* Quick Q&A */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg text-[#212121] mb-4">Quick Answers</h2>
        <div className="space-y-4 text-sm">
          {[
            {
              q: "Do points expire?",
              a: "Points do not expire as long as you place at least one order every 12 months.",
            },
            {
              q: "Can I use points with a coupon code?",
              a: "Yes — points and coupon codes can be applied to the same order.",
            },
            {
              q: "When are points credited?",
              a: "Points are credited automatically when your order status changes to 'paid'.",
            },
            {
              q: "What if I return an order?",
              a: "Points earned on returned orders are deducted from your balance.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <p className="font-semibold text-[#212121] mb-1">{q}</p>
              <p className="text-gray-500">{a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
