import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { toNum } from "@/lib/decimal";
import Image from "next/image";
import dynamicImport from "next/dynamic";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

const Testimonials   = dynamicImport(() => import("@/components/Testimonials"),   { ssr: false });
const RecentlyViewed = dynamicImport(() => import("@/components/RecentlyViewed"), { ssr: false });

export const metadata: Metadata = {
  title: "SriLaYa Naturals — Ancient Grains. Modern Nutrition.",
  description:
    "Shop 100% organic millets, millet flour, rava, flakes, rice, and traditional laddus. Farm-direct sourcing, no preservatives, pan-India delivery.",
  openGraph: {
    title: "SriLaYa Naturals — Ancient Grains. Modern Nutrition.",
    description:
      "Shop 100% organic millets, millet flour, rava, flakes, rice, and traditional laddus. Farm-direct sourcing, no preservatives, pan-India delivery.",
    url: "/",
    type: "website",
  },
};

const fetchHomeProducts = unstable_cache(
  () => prisma.product.findMany({
    where: { active: true },
    include: { variants: { where: { active: true }, orderBy: { price: "asc" as const } } },
    take: 8,
    orderBy: { reviews: "desc" },
  }),
  ["home-products"],
  { revalidate: 300, tags: ["products"] }
);

const COLLECTIONS = [
  {
    name: "Millet Rava",
    tagline: "7 varieties. Low GI. Ready in minutes.",
    href: "/rava",
    emoji: "🌾",
    bg: "#D99B26",
    text: "#2D1A00",
  },
  {
    name: "Millet Flour",
    tagline: "Stone-ground. 8 varieties. No maida.",
    href: "/flour",
    emoji: "🫓",
    bg: "#5C3A21",
    text: "#FFF8F0",
  },
  {
    name: "Natural Sweeteners",
    tagline: "Jaggery powder. 3 types. Zero chemicals.",
    href: "/sweeteners",
    emoji: "🍯",
    bg: "#b45309",
    text: "#FFF8E1",
  },
  {
    name: "Traditional Rice",
    tagline: "4 heritage varieties. Antioxidant rich.",
    href: "/traditional-rice",
    emoji: "🍚",
    bg: "#9f1239",
    text: "#FFF1F2",
  },
  {
    name: "Muesli & Granola",
    tagline: "8 varieties. Whole grain. No preservatives.",
    href: "/muesli",
    emoji: "🥣",
    bg: "#92400e",
    text: "#FFFBEB",
  },
  {
    name: "Whole Millet Grains",
    tagline: "8 unpolished varieties. Cook like rice.",
    href: "/raw-millets",
    emoji: "🌱",
    bg: "#2E6F40",
    text: "#F0FDF4",
  },
  {
    name: "Parboiled Millets",
    tagline: "Enhanced nutrition. Better digestibility.",
    href: "/parboiled-millets",
    emoji: "💧",
    bg: "#1e40af",
    text: "#EFF6FF",
  },
];

const usps = [
  { icon: "🌿", label: "100% Organic", sub: "No chemicals or pesticides" },
  { icon: "🚫", label: "No Preservatives", sub: "Minimally processed grains" },
  { icon: "⭐", label: "5-Star Rated", sub: "By our customers" },
  { icon: "🚚", label: "Pan-India Delivery", sub: "Delhivery, Blue Dart & more" },
];

const whyUs = [
  {
    icon: "🌾",
    title: "Farm-Direct Sourcing",
    desc: "We partner directly with natural-farming producers across India — no middlemen, fair prices, maximum freshness.",
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
  let products: Awaited<ReturnType<typeof fetchHomeProducts>> = [];
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("home-timeout")), 8000)
    );
    products = await Promise.race([fetchHomeProducts(), timeout]);
  } catch {
    // DB unavailable on cold start — render with empty data
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://srilayafoods.com";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: baseUrl,
    logo: `${baseUrl}/brand/srilaya-logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: BRAND.phone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      BRAND.social.facebook,
      BRAND.social.instagram,
      BRAND.social.twitter,
    ].filter(Boolean),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${baseUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      {/* -- HERO ----------------------------------------------- */}
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/product"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black px-7 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-amber-400/30 text-sm tracking-wide"
              >
                Shop Now →
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 border border-white/30 hover:bg-white/10 text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 text-sm tracking-wide"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>

        {/* decorative green swoosh at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{clipPath: "ellipse(55% 100% at 50% 100%)"}} />
      </section>

      {/* -- USP STRIP ------------------------------------------ */}
      <section className="bg-white border-b border-[#E0E0E0]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#F0F0F0]">
            {usps.map((usp) => (
              <div key={usp.label} className="flex items-center gap-3 px-4 md:px-6 py-4 md:py-5">
                <span className="text-2xl flex-shrink-0">{usp.icon}</span>
                <div>
                  <p className="font-bold text-sm text-[#212121]">{usp.label}</p>
                  <p className="text-xs text-[#9E9E9E] font-medium mt-0.5">{usp.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- COLLECTIONS SHOWCASE -------------------------------- */}
      <section className="py-12 md:py-20 bg-[#F9F9F9]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              Specialty Collections
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#212121] mt-4 mb-3 tracking-tight">
              Every Grain. Every Benefit.
            </h2>
            <p className="text-[#757575] max-w-lg mx-auto text-sm md:text-base">
              Each collection is curated around a grain's unique story, health benefit, and kitchen use.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group flex flex-col items-center text-center rounded-2xl p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-black/5"
                style={{ backgroundColor: c.bg }}
              >
                <span className="text-4xl md:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {c.emoji}
                </span>
                <h3
                  className="font-black text-sm md:text-base leading-snug mb-1"
                  style={{ color: c.text }}
                >
                  {c.name}
                </h3>
                <p
                  className="text-[11px] md:text-xs leading-relaxed opacity-80"
                  style={{ color: c.text }}
                >
                  {c.tagline}
                </p>
                <span
                  className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ color: c.text }}
                >
                  Explore →
                </span>
              </Link>
            ))}

            {/* View all collections tile */}
            <Link
              href="/collections"
              className="group flex flex-col items-center justify-center text-center rounded-2xl p-6 md:p-7 border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300"
            >
              <span className="text-4xl md:text-5xl mb-4">🗂️</span>
              <h3 className="font-black text-sm md:text-base text-emerald-800 leading-snug mb-1">
                All Collections
              </h3>
              <p className="text-[11px] md:text-xs text-emerald-600 leading-relaxed">
                See everything, including upcoming launches.
              </p>
              <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-emerald-700 group-hover:text-emerald-900 transition-colors">
                View All →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* -- FEATURED PRODUCTS ---------------------------------- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                Handpicked for You
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#212121] mt-4 tracking-tight">
                Featured Products
              </h2>
            </div>
            <Link
              href="/product"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900 border border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all"
            >
              View All Products →
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
                    className="group bg-white border border-[#E0E0E0] rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative h-52 w-full bg-[#F9F9F9] overflow-hidden">
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
                      <h3 className="font-bold text-[#212121] text-sm leading-snug mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        {lowestPrice !== null ? (
                          <div>
                            <span className="text-[10px] text-[#9E9E9E] font-medium block">Starting at</span>
                            <span className="text-lg font-black text-[#212121]">
                              ₹{lowestPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#9E9E9E] text-sm">No variants</span>
                        )}
                        <span className="w-9 h-9 rounded-xl bg-[#F9F9F9] group-hover:bg-[#00522B] text-[#9E9E9E] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm text-sm font-bold border border-[#E0E0E0] group-hover:border-emerald-700">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[#9E9E9E] py-16">No featured products yet.</p>
          )}

          <div className="text-center mt-10 sm:hidden">
            <Link href="/product" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 px-6 py-3 rounded-xl">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* -- WHY CHOOSE US -------------------------------------- */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-emerald-950 to-emerald-900 text-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left: text */}
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Why SriLaYa Naturals
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
                { value: "5★", label: "Top Rated", icon: "⭐" },
                { value: "100%", label: "Natural & Unprocessed", icon: "🌿" },
                { value: "0", label: "Preservatives Added", icon: "🚫" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-emerald-800/50 border border-emerald-700/50 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center hover:bg-[#00522B] transition-colors"
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

      {/* -- RECENTLY VIEWED ------------------------------------ */}
      <section className="bg-white border-t border-[#E0E0E0]">
        <div className="container mx-auto px-4 max-w-7xl py-4">
          <RecentlyViewed />
        </div>
      </section>

      {/* -- TESTIMONIALS --------------------------------------- */}
      <Testimonials />

      {/* -- WHATSAPP / CONTACT CTA ----------------------------- */}
      <section className="py-16 bg-amber-50 border-t border-amber-100">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <span className="text-3xl block mb-4">💬</span>
          <h2 className="text-2xl md:text-3xl font-black text-[#212121] mb-3 tracking-tight">
            Questions? We&apos;re Here to Help.
          </h2>
          <p className="text-[#757575] mb-8 max-w-lg mx-auto text-sm md:text-base">
            Reach us on WhatsApp for bulk orders, wholesale enquiries, or any product questions.
            Our team responds within the hour on working days.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-[#00522B] text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-md text-sm"
            >
              Contact Us
            </Link>
            <Link
              href="/payments"
              className="inline-flex items-center gap-2 border border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-[#424242] font-bold px-7 py-3.5 rounded-xl transition-all text-sm"
            >
              Payment Details
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
