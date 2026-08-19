import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole, isOwner } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { addPackagingItem, addPackagingStock, usePackagingStock } from "./actions";
import { Bag, Package, Scissors, Tag, ShieldCheck, Paperclip, Lightbulb } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  pouch:      "Pouches",
  box:        "Parcel Boxes",
  tape:       "Tape",
  label:      "Labels & Stickers",
  protection: "Protection",
  other:      "Other",
};

const CATEGORY_ICONS: Record<string, PhosphorIcon> = {
  pouch: Bag, box: Package, tape: Scissors, label: Tag, protection: ShieldCheck, other: Paperclip,
};

export default async function PackagingPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminRole(session?.user?.role ?? "")) notFound();

  // Exact supplier cost (costPerUnit) is owner-only, both to view and to
  // write — everyone else with page access sees "—" and cannot set it.
  const showCost = isOwner(session?.user?.role ?? "");

  const [items, suppliers] = await Promise.all([
    prisma.packagingItem.findMany({
      where:   { active: true },
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.supplier.findMany({
      where:   { active: true },
      orderBy: { name: "asc" },
      select:  { id: true, name: true },
    }),
  ]);

  const lowStock = items.filter(i => i.stockQty <= i.reorderThreshold);

  // Group by category
  const grouped = items.reduce((acc: Record<string, typeof items>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Packaging Inventory</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Pouches, boxes, tapes, labels, and packing materials</p>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          ⚠ <strong>{lowStock.length} item(s)</strong> at or below reorder level:{" "}
          {lowStock.map(i => `${i.name} (${i.stockQty} ${i.unit})`).join(", ")}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Inventory table */}
        <div className="lg:col-span-2 space-y-6">
          {items.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-10 text-center text-sm text-[#9E9E9E]">
              No packaging items added yet. Add your first item using the form →
            </div>
          ) : (
            Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const catItems = grouped[cat];
              if (!catItems?.length) return null;
              return (
                <div key={cat} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#F0F0F0] flex items-center gap-2 bg-[#FAFAFA]">
                    {(() => { const I = CATEGORY_ICONS[cat]; return I ? <I size={14} weight="regular" className="text-[#616161]" /> : null; })()}
                    <h2 className="font-bold text-[#212121] text-sm">{label}</h2>
                    <span className="ml-auto text-xs text-[#9E9E9E]">{catItems.length} item{catItems.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F5F5F5] text-[11px] uppercase font-bold text-[#9E9E9E] tracking-wider">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-right">Stock</th>
                          <th className="px-4 py-2 text-right">Reorder At</th>
                          <th className="px-4 py-2 text-right">Cost/Unit</th>
                          <th className="px-4 py-2 text-left">Supplier</th>
                          <th className="px-4 py-2 text-center">Add</th>
                          <th className="px-4 py-2 text-center">Use</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F5]">
                        {catItems.map(item => {
                          const isLow = item.stockQty <= item.reorderThreshold;
                          return (
                            <tr key={item.id} className={isLow ? "bg-red-50/40" : "hover:bg-[#FAFAFA]"}>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-[#212121]">{item.name}</span>
                                {isLow && <span className="ml-2 text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">LOW</span>}
                                {item.notes && <p className="text-[11px] text-[#9E9E9E] mt-0.5">{item.notes}</p>}
                              </td>
                              <td className={`px-4 py-3 text-right font-mono font-bold text-base ${isLow ? "text-red-600" : "text-[#006A38]"}`}>
                                {item.stockQty}
                                <span className="text-xs font-normal text-[#9E9E9E] ml-1">{item.unit}</span>
                              </td>
                              <td className="px-4 py-3 text-right text-[#9E9E9E] text-xs">{item.reorderThreshold} {item.unit}</td>
                              <td className="px-4 py-3 text-right text-[#424242]">
                                {showCost
                                  ? (item.costPerUnit ? `₹${parseFloat(item.costPerUnit.toString()).toFixed(2)}` : "—")
                                  : <span className="text-[#BDBDBD]">—</span>}
                              </td>
                              <td className="px-4 py-3 text-[#424242] text-xs">
                                {item.supplier?.name ?? <span className="text-[#BDBDBD]">Not set</span>}
                              </td>
                              {/* Add stock */}
                              <td className="px-4 py-3">
                                <form action={addPackagingStock}>
                                  <input type="hidden" name="packagingItemId" value={item.id} />
                                  <div className="flex items-center gap-1 justify-center">
                                    <input type="number" name="qty" min="1" placeholder="qty"
                                      className="w-16 border border-[#E0E0E0] rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-[#006A38]" />
                                    <button type="submit"
                                      className="bg-[#006A38] text-white text-xs px-2 py-1 rounded hover:bg-[#00522B] font-bold">
                                      +
                                    </button>
                                  </div>
                                </form>
                              </td>
                              {/* Use / deduct stock */}
                              <td className="px-4 py-3">
                                <form action={usePackagingStock}>
                                  <input type="hidden" name="packagingItemId" value={item.id} />
                                  <input type="hidden" name="type" value="used" />
                                  <div className="flex items-center gap-1 justify-center">
                                    <input type="number" name="qty" min="1" placeholder="qty"
                                      className="w-16 border border-[#E0E0E0] rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-[#006A38]" />
                                    <button type="submit"
                                      className="bg-[#424242] text-white text-xs px-2 py-1 rounded hover:bg-[#212121] font-bold">
                                      −
                                    </button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add item form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6">
            <h2 className="font-bold text-[#212121] mb-5">Add Packaging Item</h2>
            <form action={addPackagingItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Name *</label>
                <input name="name" required placeholder="e.g. 1kg Foxtail Pouch, Medium Box"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Category *</label>
                <select name="category" required
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                  <option value="">— Select —</option>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Unit</label>
                <select name="unit"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                  <option value="pcs">pcs (pieces)</option>
                  <option value="rolls">rolls</option>
                  <option value="sheets">sheets</option>
                  <option value="metres">metres</option>
                  <option value="boxes">boxes</option>
                  <option value="packets">packets</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Reorder Alert Threshold</label>
                <input name="reorderThreshold" type="number" min="0" defaultValue="50"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              {showCost && (
                <div>
                  <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Cost per Unit (₹)</label>
                  <input name="costPerUnit" type="number" step="0.01" min="0" placeholder="0.00"
                    className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Supplier</label>
                <select name="supplierId"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                  <option value="">— None —</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Notes</label>
                <input name="notes" placeholder="e.g. Ziplock, kraft paper, 3-layer"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <button type="submit"
                className="w-full bg-[#006A38] text-white font-bold py-2.5 rounded-lg hover:bg-[#00522B] text-sm">
                Add Item
              </button>
            </form>
          </div>

          {/* Supplier reminder */}
          <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded-xl p-4 text-xs text-[#795548]">
            <p className="font-bold mb-1 inline-flex items-center gap-1"><Lightbulb size={13} weight="regular" /> Packaging suppliers</p>
            <p>Add packaging suppliers under <a href="/admin/suppliers" className="text-[#006A38] underline font-semibold">Admin → Suppliers</a> first, then link them here when adding items.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
