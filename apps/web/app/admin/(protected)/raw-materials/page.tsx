'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// ── Server actions ────────────────────────────────────────────────────────────

async function addRawMaterial(formData: FormData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const name = formData.get('name')?.toString().trim();
  const unit = formData.get('unit')?.toString().trim() || 'kg';
  const costPerUnit = parseFloat(formData.get('costPerUnit')?.toString() ?? '0');
  const reorderThreshold = parseFloat(formData.get('reorderThreshold')?.toString() ?? '5');

  if (!name) return;

  await prisma.rawMaterial.create({
    data: { name, unit, costPerUnit: costPerUnit > 0 ? costPerUnit : null, reorderThreshold },
  });
  redirect('/admin/raw-materials');
}

async function addStock(formData: FormData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const rawMaterialId = formData.get('rawMaterialId')?.toString();
  const qty = parseFloat(formData.get('qty')?.toString() ?? '0');
  const note = formData.get('note')?.toString().trim() || null;

  if (!rawMaterialId || qty <= 0) return;

  await prisma.$transaction([
    prisma.rawMaterial.update({
      where: { id: rawMaterialId },
      data: { stockQty: { increment: qty } },
    }),
    prisma.rawMaterialLog.create({
      data: { rawMaterialId, type: 'purchase', qty, note },
    }),
  ]);
  redirect('/admin/raw-materials');
}

async function deleteRawMaterial(formData: FormData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const id = formData.get('id')?.toString();
  if (!id) return;

  await prisma.rawMaterial.delete({ where: { id } });
  redirect('/admin/raw-materials');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RawMaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) notFound();

  const materials = await prisma.rawMaterial.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { recipeLines: true } } },
  });

  const lowStock = materials.filter(m => m.stockQty <= m.reorderThreshold);

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Raw Materials</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Visible only to Business Owner · Laddu production ingredients</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/raw-materials/import"
            className="px-4 py-2 rounded-lg bg-[#006A38] text-white text-sm font-bold hover:bg-[#00522B]">
            📄 Import Purchase Bill
          </Link>
          <Link href="/admin/raw-materials/recipes"
            className="px-4 py-2 rounded-lg border border-[#006A38] text-[#006A38] text-sm font-bold hover:bg-[#F5F5F5]">
            📋 Recipes
          </Link>
          <Link href="/admin/production"
            className="px-4 py-2 rounded-lg border border-[#006A38] text-[#006A38] text-sm font-bold hover:bg-[#F5F5F5]">
            🏭 Log Production
          </Link>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          ⚠ <strong>{lowStock.length} material(s)</strong> at or below reorder threshold:{' '}
          {lowStock.map(m => `${m.name} (${m.stockQty.toFixed(2)} ${m.unit})`).join(', ')}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left: Material list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <h2 className="font-bold text-[#212121]">Inventory</h2>
            <span className="text-xs text-[#9E9E9E]">{materials.length} materials</span>
          </div>

          {materials.length === 0 ? (
            <p className="text-sm text-[#9E9E9E] px-6 py-10 text-center">No raw materials added yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5] text-[11px] uppercase font-bold text-[#9E9E9E] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Material</th>
                  <th className="px-5 py-3 text-right">Stock</th>
                  <th className="px-5 py-3 text-right">Cost/Unit</th>
                  <th className="px-5 py-3 text-right">Reorder At</th>
                  <th className="px-5 py-3 text-center">Add Stock</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {materials.map(m => {
                  const isLow = m.stockQty <= m.reorderThreshold;
                  return (
                    <tr key={m.id} className={isLow ? 'bg-red-50/50' : 'hover:bg-[#FAFAFA]'}>
                      <td className="px-5 py-3 font-semibold text-[#212121]">
                        {m.name}
                        <span className="ml-2 text-[11px] text-[#9E9E9E] font-normal">({m.unit})</span>
                        {isLow && <span className="ml-2 text-[10px] text-red-600 font-bold">LOW</span>}
                      </td>
                      <td className={`px-5 py-3 text-right font-mono font-bold ${isLow ? 'text-red-600' : 'text-[#006A38]'}`}>
                        {m.stockQty.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right text-[#424242]">
                        {m.costPerUnit ? `₹${m.costPerUnit.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-[#9E9E9E]">{m.reorderThreshold} {m.unit}</td>
                      <td className="px-5 py-3">
                        <form action={addStock}>
                          <input type="hidden" name="rawMaterialId" value={m.id} />
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number" name="qty" step="0.1" min="0.1" placeholder="qty"
                              className="w-20 border border-[#E0E0E0] rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-[#006A38]"
                            />
                            <button type="submit"
                              className="bg-[#006A38] text-white text-xs px-2 py-1 rounded hover:bg-[#00522B] font-bold">
                              +
                            </button>
                          </div>
                        </form>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {m._count.recipeLines === 0 && (
                          <form action={deleteRawMaterial} className="inline">
                            <input type="hidden" name="id" value={m.id} />
                            <button type="submit" className="text-[11px] text-red-400 hover:text-red-600 underline">
                              Delete
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: Add new material */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6 h-fit">
          <h2 className="font-bold text-[#212121] mb-5">Add Raw Material</h2>
          <form action={addRawMaterial} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Name *</label>
              <input name="name" required placeholder="e.g. Groundnut, Thill, Moong Dal"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Unit</label>
              <select name="unit"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="litre">litre</option>
                <option value="nos">nos (pieces)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Cost per Unit (₹)</label>
              <input name="costPerUnit" type="number" step="0.01" min="0" placeholder="0.00"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Reorder Threshold</label>
              <input name="reorderThreshold" type="number" step="0.5" min="0" defaultValue="5"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
            </div>
            <button type="submit"
              className="w-full bg-[#006A38] text-white font-bold py-2.5 rounded-lg hover:bg-[#00522B] text-sm">
              Add Material
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
