'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { redirect } from "next/navigation";

export async function saveRecipeLine(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const variantId     = formData.get('variantId')?.toString();
  const rawMaterialId = formData.get('rawMaterialId')?.toString();
  const qtyPerYield   = parseFloat(formData.get('qtyPerYield')?.toString() ?? '0');
  const yieldKg       = parseFloat(formData.get('yieldKg')?.toString() ?? '1');

  if (!variantId || !rawMaterialId || qtyPerYield <= 0) return;

  const recipe = await prisma.ladduRecipe.upsert({
    where: { variantId },
    create: { variantId, yieldKg },
    update: { yieldKg },
  });

  const existing = await prisma.recipeLine.findFirst({
    where: { recipeId: recipe.id, rawMaterialId },
  });
  if (existing) {
    await prisma.recipeLine.update({ where: { id: existing.id }, data: { qtyPerYield } });
  } else {
    await prisma.recipeLine.create({ data: { recipeId: recipe.id, rawMaterialId, qtyPerYield } });
  }

  redirect('/admin/raw-materials/recipes');
}

export async function deleteRecipeLine(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const id = formData.get('id')?.toString();
  if (id) await prisma.recipeLine.delete({ where: { id } });
  redirect('/admin/raw-materials/recipes');
}

export async function updateYield(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const recipeId = formData.get('recipeId')?.toString();
  const yieldKg  = parseFloat(formData.get('yieldKg')?.toString() ?? '1');
  if (recipeId && yieldKg > 0) {
    await prisma.ladduRecipe.update({ where: { id: recipeId }, data: { yieldKg } });
  }
  redirect('/admin/raw-materials/recipes');
}
