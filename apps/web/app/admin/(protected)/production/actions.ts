'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { redirect } from "next/navigation";

const SIZE_KG: Record<string, number> = {
  '1kg': 1, '500g': 0.5, '250g': 0.25, '200g': 0.2, '2kg': 2,
};

export async function logProduction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const variantId     = formData.get('variantId')?.toString();
  const unitsProduced = parseInt(formData.get('unitsProduced')?.toString() ?? '0');
  const notes         = formData.get('notes')?.toString().trim() || null;

  if (!variantId || unitsProduced <= 0) return;

  const recipe = await prisma.ladduRecipe.findUnique({
    where: { variantId },
    include: { lines: { include: { rawMaterial: true } } },
  });
  if (!recipe || recipe.lines.length === 0) return;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return;

  const variantKg     = SIZE_KG[variant.size] ?? 1;
  const batchesNeeded = (unitsProduced * variantKg) / recipe.yieldKg;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.create({
      data: { variantId, unitsProduced, notes, createdBy: session?.user?.email ?? null },
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
