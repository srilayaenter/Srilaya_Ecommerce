import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { saveRecipeLine, deleteRecipeLine, updateYield } from "./actions";

export const dynamic = 'force-dynamic';

export default async function RecipesPage() {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) notFound();

  const ladduVariants = await prisma.productVariant.findMany({
    where: { product: { title: { contains: 'Laddu', mode: 'insensitive' } } },
    include: {
      product: { select: { title: true } },
      ladduRecipe: { include: { lines: { include: { rawMaterial: true } } } },
    },
    orderBy: [{ product: { title: 'asc' } }, { size: 'asc' }],
  });

  const materials = await prisma.rawMaterial.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Laddu Recipes</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Define ingredient quantities per kg of finished laddu</p>
        </div>
        <Link href="/admin/raw-materials"
          className="text-sm text-[#006A38] font-bold hover:underline">← Back to Raw Materials</Link>
      </div>

      {materials.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ No raw materials defined yet.{' '}
          <Link href="/admin/raw-materials" className="underline font-bold">Add raw materials first</Link>.
        </div>
      )}

      <div className="space-y-6">
        {ladduVariants.map(v => {
          const recipe   = v.ladduRecipe;
          const totalQty = recipe?.lines.reduce((s, l) => s + l.qtyPerYield, 0) ?? 0;

          return (
            <div key={v.id} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-[#F5F5F5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#212121]">{v.product.title}</span>
                  <span className="ml-2 text-sm text-[#9E9E9E]">{v.size}</span>
                </div>
                {recipe && (
                  <form action={updateYield} className="flex items-center gap-2">
                    <input type="hidden" name="recipeId" value={recipe.id} />
                    <label className="text-xs text-[#9E9E9E] font-bold">Yield (kg):</label>
                    <input name="yieldKg" type="number" step="0.1" min="0.1" defaultValue={recipe.yieldKg}
                      className="w-20 border border-[#E0E0E0] rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-[#006A38]" />
                    <button type="submit"
                      className="text-xs bg-[#006A38] text-white px-2 py-1 rounded font-bold hover:bg-[#00522B]">
                      Save
                    </button>
                  </form>
                )}
              </div>

              {recipe && recipe.lines.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase font-bold text-[#9E9E9E] tracking-wider border-b border-[#F0F0F0]">
                    <tr>
                      <th className="px-5 py-2 text-left">Ingredient</th>
                      <th className="px-5 py-2 text-right">Qty per {recipe.yieldKg}kg yield</th>
                      <th className="px-5 py-2 text-right">Unit</th>
                      <th className="px-5 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F9F9F9]">
                    {recipe.lines.map(line => (
                      <tr key={line.id} className="hover:bg-[#FAFAFA]">
                        <td className="px-5 py-2 font-medium text-[#212121]">{line.rawMaterial.name}</td>
                        <td className="px-5 py-2 text-right font-mono text-[#006A38] font-bold">
                          {line.qtyPerYield.toFixed(3)}
                        </td>
                        <td className="px-5 py-2 text-right text-[#9E9E9E] text-xs">{line.rawMaterial.unit}</td>
                        <td className="px-5 py-2 text-right">
                          <form action={deleteRecipeLine} className="inline">
                            <input type="hidden" name="id" value={line.id} />
                            <button type="submit" className="text-[11px] text-red-400 hover:text-red-600 underline">
                              Remove
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#F5F5F5]">
                      <td className="px-5 py-2 font-bold text-[#424242]">Total</td>
                      <td className="px-5 py-2 text-right font-mono font-bold text-[#424242]">{totalQty.toFixed(3)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {materials.length > 0 && (
                <form action={saveRecipeLine}
                  className="px-5 py-4 border-t border-[#F0F0F0] flex items-end gap-3 flex-wrap">
                  <input type="hidden" name="variantId" value={v.id} />
                  <input type="hidden" name="yieldKg" value={recipe?.yieldKg ?? 1} />
                  <div>
                    <label className="block text-xs font-bold text-[#9E9E9E] mb-1">Ingredient</label>
                    <select name="rawMaterialId" required
                      className="border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38] min-w-[200px]">
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9E9E9E] mb-1">
                      Qty per {recipe?.yieldKg ?? 1}kg yield
                    </label>
                    <input name="qtyPerYield" type="number" step="0.001" min="0.001" placeholder="0.000" required
                      className="w-28 border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
                  </div>
                  <button type="submit"
                    className="bg-[#006A38] text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#00522B]">
                    + Add Ingredient
                  </button>
                </form>
              )}
            </div>
          );
        })}

        {ladduVariants.length === 0 && (
          <p className="text-sm text-[#9E9E9E] text-center py-12">No laddu variants found in the product catalog.</p>
        )}
      </div>
    </div>
  );
}
