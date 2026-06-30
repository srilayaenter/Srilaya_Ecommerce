"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl });
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
    } else {
      window.location.href = callbackUrl;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans pb-20 mt-12 px-4">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#006A38] bg-white mb-3">
          <Image src="/brand/srilaya-logo.png" alt="SriLaYa" fill className="object-cover" />
        </div>
        <h1 className="text-[32px] font-black text-[#212121] tracking-tight font-poppins">
          SriLaYa <span className="text-[#006A38]">Enterprises</span>
        </h1>
        <p className="text-[#424242] font-bold tracking-wide mt-1 uppercase text-[12px]">
          Welcome Back
        </p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full max-w-md p-8">
        {/* Google sign-in */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border-2 border-[#E0E0E0] rounded-[8px] px-4 py-3 text-[#424242] font-bold text-[14px] hover:bg-[#F9F9F9] transition-all disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#E0E0E0]" />
          <span className="text-xs text-[#9E9E9E] font-medium">or sign in with email</span>
          <div className="flex-1 h-px bg-[#E0E0E0]" />
        </div>

        <form onSubmit={handleCredentials} className="space-y-5">
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
              placeholder="••••••••"
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38] text-[#212121] transition-all"
            />
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006A38] text-white py-3 rounded-[8px] font-bold text-[15px] hover:bg-[#00522B] transition-all shadow-[0_4px_12px_rgba(0,106,56,0.2)] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-[#E0E0E0] pt-5">
          <p className="text-[14px] text-[#424242] font-medium">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#006A38] font-bold hover:underline">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
