"use client"; // Required for interactivity
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // We handle the redirect manually
    });

    if (result?.error) {
      alert("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/admin"); // Redirect to dashboard on success
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans pb-20 mt-12">
      <div className="text-center mb-8 flex flex-col items-center">
        <h1 className="text-[32px] font-black text-[#212121] tracking-tight">
          SriLaYa <span className="text-[#006A38]">Foods</span>
        </h1>
        <p className="text-[#8D6E63] font-bold tracking-wide mt-1 uppercase text-[12px]">
          Secure Admin Portal
        </p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full max-w-md p-8">
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[14px] font-bold text-[#424242] mb-1.5">Staff Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38]" 
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-bold text-[#424242] mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38]" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#006A38] text-white py-3 rounded-[8px] font-bold text-[15px] hover:bg-[#00522B] transition-all"
          >
            {loading ? "Authorizing..." : "Authorize Access"}
          </button>
        </form>
      </div>
    </div>
  );
}