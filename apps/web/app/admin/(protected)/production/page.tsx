'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ProductionForm from "./ProductionForm";

export const dynamic = 'force-dynamic';

async function logProduction(formData: FormData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const variantId    = formData.get('variantId')?.toString();
  const unitsProduced = parseInt(formData.get('unitsProduced')?.toString() ?? '0');
  const notes        = formData.get('notes')?.toString().trim() || null;

  if (!variantId || unitsProduced <= 0) return;

  // Get recipe
  const recipe = await prisma.ladduRecipe.findUnique({
    where: { variantId },
    include: { lines: { include: { rawMaterial: true } } },
  });
  if (!recipe || recipe.lines.length === 0) return;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return;

  // Calculate raw material consumption
  // unitsProduced × (size in kg / yieldKg) × qtyPerYield
  const sizeKgMap: Record<string, number> = { '1kg': 1, '500g': 0.5, '250g': 0.25, '200g': 0.2, '2kg': 2 };
  const variantKg = sizeKgMap[variant.size] ?? 1;
  const batchesNeeded = (unitsProduced * variantKg) / recipe.yieldKg;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.create({
      data: {
        variantId,
        unitsProduced,
        notes,
        createdBy: session?.user?.email ?? null,
      },
    });

    for (const line of recipe.lines) {
      const consumed = batchesNeeded * line.qtyPerYield;
      await tx.rawMaterial.update({
        where: { id: line.rawMaterialId },
        data: { stockQty: { decrement: consumed } },
      });
      await tx.rawMaterialLog.create({
        data: {
          rawMaterialId: line.rawMaterialId,
          type: 'production',
          qty: -consumed,
          note: `${unitsProduced}× ${variant.size} production`,
          batchId: batch.id,
        },
      });
    }
  });

  redirect('/admin/production');
}

export default async function ProductionPage() {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) notFound();

  const ladduVariants = await prisma.productVariant.findMany({
    where: { product: { title: { contains: 'Laddu', mode: 'insensitive' } } },
    include: {
      product: { select: { title: true } },
      ladduRecipe: {
        include: { lines: { include: { rawMaterial: true } } },
      },
    },
    orderBy: [{ product: { title: 'asc' } }, { size: 'asc' }],
  });

  const recentBatches = await prisma.productionBatch.findMany({
    orderBy: { producedAt: 'desc' },
    take: 20,
    include: {
      variant: { include: { product: { select: { title: true } } } },
    },
  });

  const variantsWithRecipe = ladduVariants.filter(v => v.ladduRecipe && v.ladduRecipe.lines.length > 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Log Production</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Record a laddu production run · Auto-deducts raw material stock</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/raw-materials"
            className="text-sm text-[#006A38] font-bold hover:underline">Raw Materials</Link>
          <Link href="/admin/raw-materials/recipes"
            className="text-sm text-[#006A38] font-bold hover:underline">Recipes</Link>
        </div>
      </div>

      {variantsWithRecipe.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ No laddu recipes defined yet.{' '}
          <Link href="/admin/raw-materials/recipes" className="underline font-bold">Set up recipes first</Link>.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">

        {/* Log form */}
        {variantsWithRecipe.length > 0 && (
          <ProductionForm variants={variantsWithRecipe} action={logProduction} />
        )}

        {/* Recent batches */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-[#F0F0F0]">
            <h2 className="font-bold text-[#212121]">Recent Production Batches</h2>
          </div>
          {recentBatches.length === 0 ? (
            <p className="text-sm text-[#9E9E9E] px-6 py-10 text-center">No production batches logged yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5] text-[11px] uppercase font-bold text-[#9E9E9E] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-right">Units</th>
                  <th className="px-5 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {recentBatches.map(b => (
                  <tr key={b.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-5 py-3 font-medium text-[#212121]">
                      {b.variant.product.title}
                      <span className="ml-1 text-[#9E9E9E] text-xs">({b.variant.size})</span>
                      {b.notes && <p className="text-[11px] text-[#9E9E9E]">{b.notes}</p>}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#006A38]">{b.unitsProduced}</td>
                    <td className="px-5 py-3 text-right text-[#9E9E9E] text-xs">
                      {new Date(b.producedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
