"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams  = useSearchParams();
  const token         = searchParams.get("token") ?? "";
  const router        = useRouter();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin/login"), 2500);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to reset password. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 font-semibold mb-4">Invalid reset link.</p>
        <Link href="/admin/forgot-password" className="text-[#006A38] font-bold text-sm hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <>
      {success ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-[#212121] mb-2">Password updated!</h2>
          <p className="text-sm text-[#616161]">Redirecting you to login…</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#616161] mb-6">Enter your new password below.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-bold text-[#424242] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38]"
              />
              <p className="text-xs text-[#9E9E9E] mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#424242] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
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
              {loading ? "Updating…" : "Set New Password"}
            </button>
          </form>
        </>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans pb-20 mt-12">
      <div className="text-center mb-8 flex flex-col items-center">
        <h1 className="text-[32px] font-black text-[#212121] tracking-tight">
          SriLaYa <span className="text-[#006A38]">Foods</span>
        </h1>
        <p className="text-[#8D6E63] font-bold tracking-wide mt-1 uppercase text-[12px]">
          Set New Password
        </p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full max-w-md p-8">
        <Suspense fallback={<p className="text-sm text-center text-[#9E9E9E]">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
