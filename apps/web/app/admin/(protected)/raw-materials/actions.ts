'use server';

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { redirect } from "next/navigation";

export async function addRawMaterial(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const name             = formData.get('name')?.toString().trim();
  const unit             = formData.get('unit')?.toString().trim() || 'kg';
  const costPerUnit      = parseFloat(formData.get('costPerUnit')?.toString() ?? '0');
  const reorderThreshold = parseFloat(formData.get('reorderThreshold')?.toString() ?? '5');

  if (!name) return;

  await prisma.rawMaterial.create({
    data: { name, unit, costPerUnit: costPerUnit > 0 ? costPerUnit : null, reorderThreshold },
  });
  redirect('/admin/raw-materials');
}

export async function addStock(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const rawMaterialId = formData.get('rawMaterialId')?.toString();
  const qty           = parseFloat(formData.get('qty')?.toString() ?? '0');
  const note          = formData.get('note')?.toString().trim() || null;

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

export async function updateRawMaterial(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const id               = formData.get('id')?.toString();
  const name             = formData.get('name')?.toString().trim();
  const unit             = formData.get('unit')?.toString().trim() || 'kg';
  const costPerUnit      = parseFloat(formData.get('costPerUnit')?.toString() ?? '0');
  const reorderThreshold = parseFloat(formData.get('reorderThreshold')?.toString() ?? '5');

  if (!id || !name) return;

  await prisma.rawMaterial.update({
    where: { id },
    data: {
      name,
      unit,
      costPerUnit: costPerUnit > 0 ? costPerUnit : null,
      reorderThreshold,
    },
  });
  redirect(`/admin/raw-materials/${id}`);
}

export async function adjustStock(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const rawMaterialId = formData.get('rawMaterialId')?.toString();
  const newQty        = parseFloat(formData.get('newQty')?.toString() ?? '0');
  const note          = formData.get('note')?.toString().trim() || 'Manual adjustment';

  if (!rawMaterialId || isNaN(newQty)) return;

  const current = await prisma.rawMaterial.findUnique({ where: { id: rawMaterialId } });
  if (!current) return;

  const delta = newQty - current.stockQty;

  await prisma.$transaction([
    prisma.rawMaterial.update({
      where: { id: rawMaterialId },
      data: { stockQty: newQty },
    }),
    prisma.rawMaterialLog.create({
      data: { rawMaterialId, type: 'adjustment', qty: delta, note },
    }),
  ]);
  redirect(`/admin/raw-materials/${rawMaterialId}`);
}

export async function deleteRawMaterial(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) return;

  const id = formData.get('id')?.toString();
  if (!id) return;

  // Delete logs and recipe lines first, then the material
  await prisma.$transaction([
    prisma.rawMaterialLog.deleteMany({ where: { rawMaterialId: id } }),
    prisma.recipeLine.deleteMany({ where: { rawMaterialId: id } }),
    prisma.rawMaterial.delete({ where: { id } }),
  ]);
  redirect('/admin/raw-materials');
}
