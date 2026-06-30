import { prisma } from "@/lib/db";
import AddBundleButton from "./AddBundleButton";

export const metadata = { title: "Bundle Packs | SriLaYa Enterprises" };

export default async function BundlesPage() {
  const bundles = await prisma.bundle.findMany({
    where: { active: true },
    include: {
      items: {
        include: {
          variant: { include: { product: { select: { title: true, image: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white font-poppins">Bundle Packs</h1>
        <p className="text-[#FFF8E1] text-sm mt-1">Curated combos at special prices — great value, zero compromise.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {bundles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">📦</p>
            <p className="font-bold text-[#212121]">No bundles available yet.</p>
            <p className="text-sm text-[#8D6E63] mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {bundles.map(bundle => {
              const originalTotal = bundle.items.reduce(
                (sum, item) => sum + parseFloat(item.variant.price?.toString() ?? "0") * item.quantity,
                0
              );
              const bundlePrice = parseFloat(bundle.price.toString());
              const savings = originalTotal - bundlePrice;

              return (
                <div key={bundle.id} className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
                  {savings > 0 && (
                    <div className="bg-[#006A38] text-white text-[11px] font-bold text-center py-1.5 tracking-wider">
                      SAVE ₹{savings.toFixed(0)} vs buying separately
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="text-lg font-black text-[#212121]">{bundle.title}</h2>
                    {bundle.description && (
                      <p className="text-sm text-[#8D6E63] mt-1">{bundle.description}</p>
                    )}

                    {/* Items list */}
                    <ul className="mt-4 space-y-2">
                      {bundle.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 bg-[#006A38]/10 rounded-full flex items-center justify-center text-[#006A38] font-bold text-xs flex-shrink-0">
                            {item.quantity}×
                          </span>
                          <span className="text-[#424242]">
                            {item.variant.product.title}
                            <span className="text-[#9E9E9E] ml-1">({item.variant.size})</span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Pricing */}
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        {savings > 0 && (
                          <p className="text-xs text-[#9E9E9E] line-through">₹{originalTotal.toFixed(2)}</p>
                        )}
                        <p className="text-2xl font-black text-[#006A38]">₹{bundlePrice.toFixed(2)}</p>
                        <p className="text-xs text-[#9E9E9E] mt-0.5">incl. GST</p>
                      </div>
                      <AddBundleButton slug={bundle.slug} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
