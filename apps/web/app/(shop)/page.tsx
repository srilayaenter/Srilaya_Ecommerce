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

const fetchHomeCategories = unstable_cache(
  () => prisma.category.findMany({
    where: { parentId: null, products: { some: {} } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true, image: true, _count: { select: { products: true } } },
  }),
  ["home-categories"],
  { revalidate: 300, tags: ["categories"] }
);

// Rich content for known category slugs. Any new category added via admin
// will automatically appear on the homepage using a gradient fallback.
const CATEGORY_RICH: Record<string, {
  image?: string;
  color: string;
  wellness: string[];
}> = {
  "millet-flakes": {
    // TODO: replace with dedicated Flakes flyer when ready
    color:   "from-amber-900/80 to-amber-700/50",
    wellness: [
      "⚡ Ready in under 5 minutes",
      "💪 High protein & heart-healthy",
      "🌿 Promotes healthy gut flora",
      "🥣 Great oats alternative for breakfast",
    ],
  },
  "flakes": {
    // TODO: replace with dedicated Flakes flyer when ready
    color:   "from-amber-900/80 to-amber-700/50",
    wellness: [
      "⚡ Ready in under 5 minutes",
      "💪 High protein & heart-healthy",
      "🌿 Promotes healthy gut flora",
      "🥣 Great oats alternative for breakfast",
    ],
  },
  "millet-rice": {
    image:   "/categories/Pamphlet_RawMillet.webp",
    color:   "from-teal-900/80 to-teal-700/50",
    wellness: [
      "📉 Low glycaemic index",
      "✅ Ideal for diabetics & weight-watchers",
      "⏱️ Keeps you fuller for longer",
      "💎 More nutrients than polished white rice",
    ],
  },
  "rice": {
    image:   "/categories/Pamphlet_RawMillet.webp",
    color:   "from-teal-900/80 to-teal-700/50",
    wellness: [
      "📉 Low glycaemic index",
      "✅ Ideal for diabetics & weight-watchers",
      "⏱️ Keeps you fuller for longer",
      "💎 More nutrients than polished white rice",
    ],
  },
  "traditional-rice": {
    image:   "/categories/Pamphlet_TraditionalRice.webp",
    color:   "from-teal-800/80 to-teal-600/50",
    wellness: [
      "🌾 Heritage varieties — hand-picked & sun-dried",
      "💎 Rich in micronutrients & antioxidants",
      "🍚 Authentic flavour from traditional farming",
      "✅ Low-intervention, chemical-free cultivation",
    ],
  },
  "parboiled": {
    image:   "/categories/Pamphlet_ParboiledMillet.webp",
    color:   "from-lime-900/80 to-lime-700/50",
    wellness: [
      "📊 Higher resistant starch than white rice",
      "⚡ Better nutrient retention than raw milling",
      "❤️ Supports gut health & steady energy",
      "🍽️ Firm texture — perfect for biryanis & meals",
    ],
  },
  "millet-flour": {
    image:   "/categories/Pamphlet_MilletFlour.webp",
    color:   "from-orange-900/80 to-orange-700/50",
    wellness: [
      "🫓 Perfect for rotis, dosas & bakes",
      "🦴 High calcium — great for bone health",
      "🌟 Rich in B-vitamins & antioxidants",
      "🚫 No maida, no refined grains",
    ],
  },
  "flour": {
    image:   "/categories/Pamphlet_MilletFlour.webp",
    color:   "from-orange-900/80 to-orange-700/50",
    wellness: [
      "🫓 Perfect for rotis, dosas & bakes",
      "🦴 High calcium — great for bone health",
      "🌟 Rich in B-vitamins & antioxidants",
      "🚫 No maida, no refined grains",
    ],
  },
  "millet-rava": {
    image:   "/categories/Pamphlet_MilletRava.webp",
    color:   "from-indigo-900/80 to-indigo-700/50",
    wellness: [
      "❤️ Heart-healthy high-fibre base",
      "📊 Keeps cholesterol levels in check",
      "⚡ Slow-release energy all morning",
      "🍲 Versatile — upma, porridge, khichdi",
    ],
  },
  "rava": {
    image:   "/categories/Pamphlet_MilletRava.webp",
    color:   "from-indigo-900/80 to-indigo-700/50",
    wellness: [
      "❤️ Heart-healthy high-fibre base",
      "📊 Keeps cholesterol levels in check",
      "⚡ Slow-release energy all morning",
      "🍲 Versatile — upma, porridge, khichdi",
    ],
  },
  "laddu": {
    // TODO: replace with dedicated Laddu flyer when ready
    color:   "from-rose-900/80 to-rose-700/50",
    wellness: [
      "🍯 No refined sugar — sweetened with jaggery",
      "⚡ Natural energy boost for kids & adults",
      "💪 Rich in iron & traditional herbs",
      "🎁 Festive gifting with a healthy twist",
    ],
  },
  "sweeteners": {
    image:   "/categories/Pamphlet_Sweetnercollection.webp",
    color:   "from-amber-900/80 to-amber-700/50",
    wellness: [
      "📉 Lower GI than refined white sugar",
      "💎 Retains natural minerals & trace elements",
      "🌿 Unrefined palm & cane jaggery",
      "✅ Direct 1:1 substitute in all recipes",
    ],
  },
  "muesli-and-granola": {
    image:   "/categories/Pamphlet_ReadytoEat.webp",
    color:   "from-yellow-900/80 to-yellow-700/50",
    wellness: [
      "🌾 Whole grain oats & millet base",
      "🍯 Sweetened with natural jaggery & honey",
      "💪 High fibre — keeps you full all morning",
      "🥛 Perfect with milk, curd, or smoothie bowls",
    ],
  },
  "muesli-granola": {
    image:   "/categories/Pamphlet_ReadytoEat.webp",
    color:   "from-yellow-900/80 to-yellow-700/50",
    wellness: [
      "🌾 Whole grain oats & millet base",
      "🍯 Sweetened with natural jaggery & honey",
      "💪 High fibre — keeps you full all morning",
      "🥛 Perfect with milk, curd, or smoothie bowls",
    ],
  },
  "malt-and-health-mixes": {
    color:   "from-purple-900/80 to-purple-700/50",
    wellness: [
      "🌿 Sprouted malt for easy digestion",
      "💪 High protein & calorie-dense for active lifestyles",
      "🧒 Ideal for growing children & nursing mothers",
      "🍵 Mix with warm milk for a nourishing drink",
    ],
  },
  "malt-health-mixes": {
    color:   "from-purple-900/80 to-purple-700/50",
    wellness: [
      "🌿 Sprouted malt for easy digestion",
      "💪 High protein & calorie-dense for active lifestyles",
      "🧒 Ideal for growing children & nursing mothers",
      "🍵 Mix with warm milk for a nourishing drink",
    ],
  },
  "millet-parboiled": {
    image:   "/categories/Pamphlet_ParboiledMillet.webp",
    color:   "from-lime-900/80 to-lime-700/50",
    wellness: [
      "📊 Higher resistant starch than white rice",
      "⚡ Better nutrient retention than raw milling",
      "❤️ Supports gut health & steady energy",
      "🍽️ Firm texture — perfect for biryanis & meals",
    ],
  },
};

// Fallback gradient colours for any future category
const FALLBACK_COLORS = [
  "from-emerald-900/80 to-emerald-700/50",
  "from-cyan-900/80 to-cyan-700/50",
  "from-violet-900/80 to-violet-700/50",
  "from-green-900/80 to-green-700/50",
  "from-sky-900/80 to-sky-700/50",
];

const usps = [
  { icon: "🌿", label: "100% Organic", sub: "No chemicals or pesticides" },
  { icon: "🚫", label: "No Preservatives", sub: "Minimally processed grains" },
  { icon: "😊", label: "75+ Customers", sub: "Across Bengaluru" },
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
  let dbCategories: Awaited<ReturnType<typeof fetchHomeCategories>> = [];
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("home-timeout")), 8000)
    );
    [products, dbCategories] = await Promise.race([
      Promise.all([fetchHomeProducts(), fetchHomeCategories()]),
      timeout,
    ]);
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

      {/* -- CATEGORY SHOWCASE ---------------------------------- */}
      <section className="py-12 md:py-20 bg-[#F9F9F9]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              Browse by Category
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#212121] mt-4 mb-3 tracking-tight">
              What Are You Looking For?
            </h2>
            <p className="text-[#757575] max-w-lg mx-auto text-sm md:text-base">
              From everyday millet grains to ready-to-cook flakes and traditional sweets —
              we have something for every health goal.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
            {dbCategories.map((cat, idx) => {
              const rich    = CATEGORY_RICH[cat.slug];
              const imgSrc  = rich?.image ?? cat.image;
              const color   = rich?.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
              const wellness = rich?.wellness ?? [];
              const description = cat.description ?? "";
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
                >
                  {/* Image area */}
                  <div className="relative aspect-[4/5]">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    ) : (
                      /* Gradient placeholder for categories without a photo */
                      <div className={`absolute inset-0 bg-gradient-to-br ${color} flex items-center justify-center`}>
                        <span className="text-5xl opacity-60">🌾</span>
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-t ${color} group-hover:opacity-95 transition-opacity duration-300`} />
                  </div>

                  {/* Info panel */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                    <h3 className="text-white font-black text-base md:text-lg leading-tight drop-shadow">
                      {cat.name}
                    </h3>
                    {description && (
                      <p className="text-white/80 text-xs mt-1 font-medium">{description}</p>
                    )}

                    {wellness.length > 0 && (
                      <div className="max-h-0 group-hover:max-h-52 overflow-hidden transition-all duration-500 ease-in-out">
                        <ul className="mt-3 space-y-1.5">
                          {wellness.map((tip) => (
                            <li key={tip} className="text-white/90 text-[11px] md:text-xs leading-snug">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <span className="inline-block mt-3 text-xs font-black text-amber-300 group-hover:text-amber-200 group-hover:tracking-wide transition-all duration-200">
                      Shop Now →
                    </span>
                  </div>
                </Link>
              );
            })}
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
                { value: "75+", label: "Happy Customers", icon: "😊" },
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
