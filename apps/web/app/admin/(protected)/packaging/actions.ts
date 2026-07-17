"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addPackagingItem(formData: FormData) {
  const name     = formData.get("name") as string;
  const category = formData.get("category") as string;
  const unit     = (formData.get("unit") as string) || "pcs";
  const reorderThreshold = parseInt(formData.get("reorderThreshold") as string) || 50;
  const costPerUnit  = formData.get("costPerUnit") ? parseFloat(formData.get("costPerUnit") as string) : null;
  const supplierId   = (formData.get("supplierId") as string) || null;
  const notes        = (formData.get("notes") as string) || null;

  if (!name?.trim() || !category) return;

  await prisma.packagingItem.create({
    data: {
      name: name.trim(), category, unit,
      reorderThreshold, costPerUnit, notes,
      supplierId: supplierId || null,
    },
  });
  revalidatePath("/admin/packaging");
}

export async function addPackagingStock(formData: FormData) {
  const packagingItemId = formData.get("packagingItemId") as string;
  const qty  = parseInt(formData.get("qty") as string);
  const note = (formData.get("note") as string) || null;
  if (!packagingItemId || !qty || qty <= 0) return;

  await prisma.$transaction([
    prisma.packagingItem.update({
      where: { id: packagingItemId },
      data:  { stockQty: { increment: qty } },
    }),
    prisma.packagingStockLog.create({
      data: { packagingItemId, type: "purchase", qty, note },
    }),
  ]);
  revalidatePath("/admin/packaging");
}

export async function usePackagingStock(formData: FormData) {
  const packagingItemId = formData.get("packagingItemId") as string;
  const qty  = parseInt(formData.get("qty") as string);
  const type = (formData.get("type") as string) || "used";
  const note = (formData.get("note") as string) || null;
  if (!packagingItemId || !qty || qty <= 0) return;

  await prisma.$transaction([
    prisma.packagingItem.update({
      where: { id: packagingItemId },
      data:  { stockQty: { decrement: qty } },
    }),
    prisma.packagingStockLog.create({
      data: { packagingItemId, type, qty: -qty, note },
    }),
  ]);
  revalidatePath("/admin/packaging");
}

export async function updatePackagingSupplier(formData: FormData) {
  const id         = formData.get("id") as string;
  const supplierId = (formData.get("supplierId") as string) || null;
  if (!id) return;
  await prisma.packagingItem.update({
    where: { id },
    data:  { supplierId: supplierId || null },
  });
  revalidatePath("/admin/packaging");
}
