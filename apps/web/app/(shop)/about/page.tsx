import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "SriLaYa Enterprises is on a mission to revive traditional Indian millets — sourced farm-direct, minimally processed, zero preservatives, and delivered across India.",
};

export default function AboutUsPage() {
  return (
    <div className="bg-white text-[#212121]">
      <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-4 mb-4 tracking-tight">
            About {BRAND.name}
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto font-medium leading-relaxed">
            Reviving traditional grains and bringing the wholesome goodness of organic millets from across India straight to your kitchen.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md">
              Rooted in Health
            </span>
            <h2 className="text-3xl font-bold text-[#212121] mt-3 mb-6 tracking-tight">
              Why We Care About Millets
            </h2>
            <div className="space-y-4 text-[#616161] leading-relaxed text-sm md:text-base">
              <p>
                For generations, millets were the backbone of traditional Indian agriculture and nutrition. Rich in dietary fiber, packed with essential minerals, and naturally gluten-free, these ancient super-grains hold the key to combating modern lifestyle health challenges.
              </p>
              <p>
                At <strong>{BRAND.name}</strong>, we are dedicated to making healthy eating effortless, authentic, and delicious. From pure millet rice and nutrient-dense flours to guilt-free traditional laddus, we bridge the gap between ancient wisdom and contemporary convenience.
              </p>
            </div>
          </div>

          <div className="bg-[#F9F9F9] p-8 rounded-2xl border border-[#E0E0E0] shadow-sm relative">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-[#212121] flex items-center gap-2 mb-2">
                  <span className="p-1.5 bg-emerald-700 text-white rounded-lg text-xs">??</span>
                  Our Mission
                </h3>
                <p className="text-[#616161] text-sm leading-relaxed">
                  To empower families to transition toward sustainable, nutrient-rich food choices by providing 100% clean, minimally processed millet varieties and natural sweeteners.
                </p>
              </div>
              <div className="border-t border-[#E0E0E0]/60 pt-6">
                <h3 className="text-lg font-bold text-[#212121] flex items-center gap-2 mb-2">
                  <span className="p-1.5 bg-amber-500 text-white rounded-lg text-xs">??</span>
                  Our Commitment
                </h3>
                <p className="text-[#616161] text-sm leading-relaxed">
                  We maintain absolute transparency in sourcing. By partnering with dedicated organic farmers across India, we ensure fair trade practices while bringing you the finest, pesticide-free harvest.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F9F9F9] py-16 border-y border-[#E0E0E0]">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-2xl font-bold text-[#212121] mb-12">
            The Promises We Live By
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0] flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-xl mb-4">
                ??
              </div>
              <h4 className="font-bold text-[#212121] text-base mb-2">100% Organic</h4>
              <p className="text-[#757575] text-xs leading-relaxed max-w-xs">
                No chemical fertilizers, harmful artificial colors, or chemical preservatives. Pure nature, exactly as intended.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0] flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-xl mb-4">
                ??
              </div>
              <h4 className="font-bold text-[#212121] text-base mb-2">
                Minimally Processed
              </h4>
              <p className="text-[#757575] text-xs leading-relaxed max-w-xs">
                We utilize gentle, traditional processing techniques to safeguard the essential dietary fibers and innate nutrients.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0] flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-xl mb-4">
                ??
              </div>
              <h4 className="font-bold text-[#212121] text-base mb-2">
                Pure Sweeteners
              </h4>
              <p className="text-[#757575] text-xs leading-relaxed max-w-xs">
                Absolutely zero chemical white sugars. We exclusively curate wholesome, pristine natural alternatives for honest energy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 text-center container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-extrabold text-[#212121] mb-4 tracking-tight">
          Ready to Make the Switch?
        </h2>
        <p className="text-[#757575] max-w-lg mx-auto mb-8 text-sm md:text-base leading-relaxed">
          Take your first step toward structural wellness, vibrant health, and dynamic, clean energy by stocking your pantry with genuine organic goodness.
        </p>
        <Link
          href="/product"
          className="inline-flex items-center justify-center font-bold text-sm bg-[#006A38] text-white hover:bg-[#00522B] px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Explore Products Catalog
        </Link>
      </section>
    </div>
  );
}