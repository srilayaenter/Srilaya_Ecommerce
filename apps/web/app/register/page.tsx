"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

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
    const res  = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Registration failed.");
      return;
    }

    // Auto sign-in after registration
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      // Account created but sign-in failed — send to login
      window.location.href = "/login";
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans pb-20 mt-12 px-4">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#006A38] bg-white mb-3">
          <Image src="/brand/srilaya-logo.png" alt="SriLaYa" fill className="object-cover" />
        </div>
        <h1 className="text-[32px] font-black text-[#212121] tracking-tight font-poppins">
          SriLaYa <span className="text-[#006A38]">Naturals</span>
        </h1>
        <p className="text-[#424242] font-bold tracking-wide mt-1 uppercase text-[12px]">
          Create Your Account
        </p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full max-w-md p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[14px] font-bold text-[#424242] mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ravi Kumar"
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38] text-[#212121] transition-all"
            />
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#424242] mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38] text-[#212121] transition-all"
            />
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#424242] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38] text-[#212121] transition-all"
            />
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#424242] mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Re-enter password"
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38] text-[#212121] transition-all"
            />
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006A38] text-white py-3 rounded-[8px] font-bold text-[15px] hover:bg-[#00522B] transition-all shadow-[0_4px_12px_rgba(0,106,56,0.2)] disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-[#E0E0E0] pt-5">
          <p className="text-[14px] text-[#424242] font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-[#006A38] font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
