import Link from "next/link";

export default function CustomerLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans pb-20 mt-12">
      
      {/* Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <h1 className="text-[32px] font-black text-[#212121] tracking-tight font-poppins">
          SriLaYa <span className="text-[#006A38]">Foods</span>
        </h1>
        <p className="text-[#8D6E63] font-bold tracking-wide mt-1 uppercase text-[12px]">
          Welcome Back
        </p>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full max-w-md p-8">
        <form className="space-y-6">
          <div>
            <label className="block text-[14px] font-bold text-[#424242] mb-1.5">Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38] text-[#212121] transition-all" 
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[14px] font-bold text-[#424242]">Password</label>
              <Link href="/forgot-password" className="text-[12px] font-bold text-[#006A38] hover:underline">
                Forgot?
              </Link>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-3 focus:outline-none focus:border-[#006A38] focus:ring-1 focus:ring-[#006A38] text-[#212121] transition-all" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#006A38] text-white py-3 rounded-[8px] font-bold text-[15px] hover:bg-[#00522B] transition-all shadow-[0_4px_12px_rgba(0,106,56,0.2)] mt-2"
          >
            Sign In to Account
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#E0E0E0] pt-6">
          <p className="text-[14px] text-[#424242] font-medium">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#006A38] font-bold hover:underline">
              Create one here
            </Link>
          </p>
        </div>
      </div>
      
    </div>
  );
}