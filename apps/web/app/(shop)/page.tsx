import { prisma } from "@/lib/db";
import Link from "next/link";
import { toNum } from "@/lib/decimal";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import Testimonials from "@/components/Testimonials";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SriLaYa Enterprises — Ancient Grains. Modern Nutrition.",
  description:
    "Shop 100% organic millets, millet flour, rava, flakes, rice, and traditional laddus. Farm-direct sourcing, no preservatives, pan-India delivery.",
  openGraph: {
    title: "SriLaYa Enterprises — Ancient Grains. Modern Nutrition.",
    description:
      "Shop 100% organic millets, millet flour, rava, flakes, rice, and traditional laddus. Farm-direct sourcing, no preservatives, pan-India delivery.",
    url: "/",
    type: "website",
  },
};

const productQuery = {
  include: { variants: { orderBy: { price: "asc" as const } } },
} satisfies Prisma.ProductFindManyArgs;

type ProductWithVariants = Prisma.ProductGetPayload<typeof productQuery>;

const categories = [
  {
    name: "Millets",
    description: "Foxtail, Ragi, Pearl & more",
    image: "/categories/Barnyard millet.png",
    href: "/category/millets",
    color: "from-emerald-900/80 to-emerald-700/50",
    wellness: [
      "🩸 Regulates blood sugar naturally",
      "💪 Rich in iron, calcium & magnesium",
      "🌿 100% gluten-free & gut-friendly",
      "⚖️ Supports healthy weight management",
    ],
  },
  {
    name: "Millet Flakes",
    description: "Quick-cook, nutrient-dense",
    image: "/categories/Pamphlet_MilletFlakes.png",
    href: "/category/millet-flakes",
    color: "from-amber-900/80 to-amber-700/50",
    wellness: [
      "⚡ Ready in under 5 minutes",
      "🫀 High protein & heart-healthy",
      "🦠 Promotes healthy gut flora",
      "🥣 Great oats alternative for breakfast",
    ],
  },
  {
    name: "Millet Rice",
    description: "White rice alternative",
    image: "/categories/Pamphlet_MilletRice.png",
    href: "/category/millet-rice",
    color: "from-teal-900/80 to-teal-700/50",
    wellness: [
      "📉 Low glycaemic index",
      "🩺 Ideal for diabetics & weight-watchers",
      "🍽️ Keeps you fuller for longer",
      "🌾 More nutrients than polished white rice",
    ],
  },
  {
    name: "Millet Flour",
    description: "Ragi, pearl & multi-millet",
    image: "/categories/Pamphlet_MilletFlour.png",
    href: "/category/millet-flour",
    color: "from-orange-900/80 to-orange-700/50",
    wellness: [
      "🧁 Perfect for rotis, dosas & bakes",
      "🦴 High calcium — great for bone health",
      "🧬 Rich in B-vitamins & antioxidants",
      "🚫 No maida, no refined grains",
    ],
  },
  {
    name: "Millet Rava",
    description: "Healthy upma & porridge base",
    image: "/categories/Pamphlet_MilletRava.png",
    href: "/category/millet-rava",
    color: "from-indigo-900/80 to-indigo-700/50",
    wellness: [
      "❤️ Heart-healthy high-fibre base",
      "📊 Keeps cholesterol levels in check",
      "🔋 Slow-release energy all morning",
      "🥗 Versatile — upma, porridge, khichdi",
    ],
  },
  {
    name: "Laddus",
    description: "Traditional millet sweets",
    image: "/categories/Foxtail Millet Flakes.png",
    href: "/category/laddu",
    color: "from-rose-900/80 to-rose-700/50",
    wellness: [
      "🍬 No refined sugar — sweetened with jaggery",
      "🔥 Natural energy boost for kids & adults",
      "🌺 Rich in iron & traditional herbs",
      "🎁 Festive gifting with a healthy twist",
    ],
  },
  {
    name: "Sweeteners",
    description: "Jaggery, palm sugar & more",
    image: "/categories/Pamphlet_Sweetnercollection.png",
    href: "/category/sweeteners",
    color: "from-amber-900/80 to-amber-700/50",
    wellness: [
      "📉 Lower GI than refined white sugar",
      "⚗️ Retains natural minerals & trace elements",
      "🌴 Unrefined palm & cane jaggery",
      "🧑‍🍳 Direct 1:1 substitute in all recipes",
    ],
  },
];

const usps = [
  { icon: "🌱", label: "100% Organic", sub: "No chemicals or pesticides" },
  { icon: "🚫", label: "No Preservatives", sub: "Minimally processed grains" },
  { icon: "😊", label: "5000+ Customers", sub: "Across India" },
  { icon: "🚚", label: "Pan-India Delivery", sub: "Delhivery, Blue Dart & more" },
];

const whyUs = [
  {
    icon: "🌾",
    title: "Farm-Direct Sourcing",
    desc: "We partner with certified organic farmers across India — no middlemen, fair prices, maximum freshness.",
  },
  {
    icon: "🔬",
    title: "Quality Tested",
    desc: "Every batch is checked for purity and nutritional integrity before it reaches your doorstep.",
  },
  {
    icon: "♻️",
    title: "Sustainable Packaging",
    desc: "Our packaging is designed to minimise waste while keeping your grains fresh for longer.",
  },
];

export default async function HomePage() {
  const products: ProductWithVariants[] = await prisma.product.findMany({
    ...productQuery,
    where: { active: true },
    take: 8,
    orderBy: { reviews: "desc" },
  });

  return (
    <div className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white overflow-hidden">
        {/* subtle dot grid texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl py-24 md:py-32 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 border border-amber-400/30">
              100% Organic &amp; Natural
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              Ancient Grains.<br />
              <span className="text-amber-400">Modern Nutrition.</span>
            </h1>
            <p className="text-emerald-100 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
              Pure, minimally-processed millets, flakes, and traditional foods sourced directly from
              organic farmers across India — straight to your kitchen.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/product"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black px-7 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-amber-400/30 text-sm tracking-wide"
              >
                Shop Now →
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>

        {/* decorative green swoosh at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{clipPath: "ellipse(55% 100% at 50% 100%)"}} />
      </section>

      {/* ── USP STRIP ────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {usps.map((usp) => (
              <div key={usp.label} className="flex items-center gap-3 px-6 py-5">
                <span className="text-2xl flex-shrink-0">{usp.icon}</span>
                <div>
                  <p className="font-bold text-sm text-slate-800">{usp.label}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{usp.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY SHOWCASE ────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              Browse by Category
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-4 mb-3 tracking-tight">
              What Are You Looking For?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base">
              From everyday millet grains to ready-to-cook flakes and traditional sweets —
              we have something for every health goal.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
              >
                {/* Fixed image area */}
                <div className="relative aspect-[4/5]">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  {/* Gradient overlay — darkens on hover for readability */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} group-hover:opacity-95 transition-opacity duration-300`} />
                </div>

                {/* Info panel — sits below the image, slides up to cover it on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <h3 className="text-white font-black text-base md:text-lg leading-tight drop-shadow">
                    {cat.name}
                  </h3>
                  <p className="text-white/80 text-xs mt-1 font-medium">{cat.description}</p>

                  {/* Wellness bullets — hidden by default, expands on hover */}
                  <div className="max-h-0 group-hover:max-h-52 overflow-hidden transition-all duration-500 ease-in-out">
                    <ul className="mt-3 space-y-1.5">
                      {cat.wellness.map((tip) => (
                        <li key={tip} className="text-white/90 text-[11px] md:text-xs leading-snug">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <span className="inline-block mt-3 text-xs font-black text-amber-300 group-hover:text-amber-200 group-hover:tracking-wide transition-all duration-200">
                    Shop Now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                Handpicked for You
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-4 tracking-tight">
                Featured Products
              </h2>
            </div>
            <Link
              href="/product"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900 border border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all"
            >
              View All →
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((product) => {
                const lowestPrice = product.variants.length > 0
                  ? toNum(product.variants[0].price)
                  : null;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative h-52 w-full bg-slate-50 overflow-hidden">
                      <Image
                        src={product.image || "https://placehold.co/400x400/006A38/white?text=SriLaYa"}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                        {product.variants.length} size{product.variants.length !== 1 ? "s" : ""} available
                      </p>
                      <h3 className="font-bold text-slate-800 text-sm leading-snug mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        {lowestPrice !== null ? (
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block">Starting at</span>
                            <span className="text-lg font-black text-slate-900">
                              ₹{lowestPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">No variants</span>
                        )}
                        <span className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-emerald-700 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm text-sm font-bold border border-slate-100 group-hover:border-emerald-700">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-16">No featured products yet.</p>
          )}

          <div className="text-center mt-10 sm:hidden">
            <Link href="/product" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 px-6 py-3 rounded-xl">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-emerald-950 to-emerald-900 text-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left: text */}
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Why SriLaYa Foods
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-5 mb-4">
                We Don&apos;t Just Sell Grains.<br />
                <span className="text-amber-400">We Revive Traditions.</span>
              </h2>
              <p className="text-emerald-200 text-sm md:text-base leading-relaxed mb-10 max-w-md">
                For generations, millets formed the backbone of Indian nutrition. We&apos;re bringing
                that wisdom back — with the transparency and quality that modern families deserve.
              </p>

              <div className="space-y-6">
                {whyUs.map((item) => (
                  <div key={item.title} className="flex gap-4 items-start">
                    <div className="w-11 h-11 rounded-xl bg-emerald-800 flex items-center justify-center text-xl flex-shrink-0 border border-emerald-700">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-emerald-300 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 mt-10 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black px-6 py-3 rounded-xl transition-all text-sm"
              >
                Read Our Story →
              </Link>
            </div>

            {/* Right: stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "22+", label: "Millet Varieties", icon: "🌾" },
                { value: "5000+", label: "Happy Customers", icon: "😊" },
                { value: "100%", label: "Certified Organic", icon: "✅" },
                { value: "0", label: "Preservatives Added", icon: "🚫" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-emerald-800/50 border border-emerald-700/50 rounded-2xl p-6 flex flex-col items-center text-center hover:bg-emerald-800 transition-colors"
                >
                  <span className="text-3xl mb-2">{stat.icon}</span>
                  <span className="text-3xl font-black text-amber-400 leading-none">{stat.value}</span>
                  <span className="text-emerald-300 text-xs font-medium mt-2 leading-snug">{stat.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <Testimonials />

      {/* ── WHATSAPP / CONTACT CTA ───────────────────────────── */}
      <section className="py-16 bg-amber-50 border-t border-amber-100">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <span className="text-3xl block mb-4">💬</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">
            Questions? We&apos;re Here to Help.
          </h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto text-sm md:text-base">
            Reach us on WhatsApp for bulk orders, wholesale enquiries, or any product questions.
            Our team responds within the hour on working days.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-md text-sm"
            >
              Contact Us
            </Link>
            <Link
              href="/payments"
              className="inline-flex items-center gap-2 border border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 font-bold px-7 py-3.5 rounded-xl transition-all text-sm"
            >
              Payment Details
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
