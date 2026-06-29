"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    setLoading(false);

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans pb-20 mt-12">
      <div className="text-center mb-8 flex flex-col items-center">
        <h1 className="text-[32px] font-black text-[#212121] tracking-tight">
          SriLaYa <span className="text-[#006A38]">Foods</span>
        </h1>
        <p className="text-[#8D6E63] font-bold tracking-wide mt-1 uppercase text-[12px]">
          Password Reset
        </p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full max-w-md p-8">
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-lg font-bold text-[#212121] mb-2">Check your inbox</h2>
            <p className="text-sm text-[#616161] mb-6">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. It expires in 1 hour.
            </p>
            <Link href="/admin/login" className="text-[#006A38] font-bold text-sm hover:underline">
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#616161] mb-6">
              Enter your staff email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[14px] font-bold text-[#424242] mb-1.5">
                  Staff Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38]"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#006A38] text-white py-3 rounded-[8px] font-bold text-[15px] hover:bg-[#00522B] transition-all disabled:opacity-70"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <div className="text-center mt-5">
              <Link href="/admin/login" className="text-[#8D6E63] text-sm hover:text-[#006A38] transition-colors">
                ← Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
