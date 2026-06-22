import Link from "next/link";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";

export default function StorefrontHomePage() {
  return (
    <div className="w-full font-sans bg-[#F5F5F5] min-h-screen pb-20">
      <section className="bg-[#FFF8E1] w-full py-20 border-b border-[#E0E0E0]">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col items-center text-center">
          <span className="text-[#006A38] font-bold tracking-widest uppercase text-[12px] mb-4 bg-[#006A38]/10 px-4 py-1.5 rounded-full">
            100% Certified Organic
          </span>
          <h1 className="text-[42px] md:text-[56px] font-black text-[#212121] tracking-tight font-poppins leading-tight max-w-4xl">
            Nourish Your Family with <br />
            <span className="text-[#006A38]">SriLaYa Foods</span>
          </h1>
          <p className="text-[#8D6E63] text-[18px] mt-6 max-w-2xl font-medium leading-relaxed">
            From perfectly flattened Barnyard flakes to traditional sweets naturally sweetened with coconut jaggery powder. Experience the true taste of tradition and health.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link href="/all-products">
              <button className="bg-[#006A38] text-white px-8 py-3.5 rounded-[8px] font-bold text-[15px] hover:bg-[#00522B] transition-all shadow-[0_4px_14px_rgba(0,106,56,0.25)]">
                Shop Our Catalog
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}