import { prisma } from "@/lib/db";
import { deriveWeightGramsFromSize } from "@/lib/weight";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import NewProductForm from "./NewProductForm";

async function createProduct(formData: FormData) {
  'use server';

  const title       = formData.get('title') as string;
  const description = formData.get('description') as string;
  const categoryId  = formData.get('categoryId') as string;
  const isFeatured  = formData.get('isFeatured') === 'on';
  const isActive    = formData.get('isActive') === 'on';

  const certification   = formData.get('certification') as string;
  const shelfLife       = formData.get('shelfLife') as string;
  const storage         = formData.get('storage') as string;
  const nutritionalInfo = formData.get('nutritionalInfo') as string;

  const size        = (formData.get('size') as string)?.trim();
  const price       = parseFloat(formData.get('price') as string);
  const stock       = parseInt(formData.get('stock') as string, 10);
  const gstRate     = parseFloat(formData.get('gstRate') as string) || 0;
  const weightGramsRaw = parseInt(formData.get('weightGrams') as string, 10);
  const weightGrams = weightGramsRaw > 0 ? weightGramsRaw : (deriveWeightGramsFromSize(size) ?? 500);

  // SKU: use what the client sent (auto-generated or manually edited)
  // Ensure uniqueness by appending a counter if there's a conflict
  const baseSku = ((formData.get('sku') as string) || `PRD-${Date.now()}`).toUpperCase().trim();

  // Variant SKU: always {productSku}-{SIZE} (no random suffix)
  const variantSku = size
    ? `${baseSku}-${size.toUpperCase().replace(/\s+/g, "")}`
    : baseSku;

  if (!title || !categoryId || isNaN(price) || isNaN(stock)) return;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  // Check for existing SKU and append counter if needed
  const existing = await prisma.product.findUnique({ where: { sku: baseSku } });
  const finalSku = existing ? `${baseSku}-${Date.now().toString().slice(-4)}` : baseSku;
  const finalVariantSku = size
    ? `${finalSku}-${size.toUpperCase().replace(/\s+/g, "")}`
    : finalSku;

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        title,
        slug,
        description: [
          description,
          certification   ? `**Certification:** ${certification}` : "",
          shelfLife       ? `**Shelf Life:** ${shelfLife}` : "",
          storage         ? `**Storage:** ${storage}` : "",
          nutritionalInfo ? `**Nutrition:** ${nutritionalInfo}` : "",
        ].filter(Boolean).join("\n\n"),
        categoryId,
        active: isActive,
        sku:    finalSku,
        gstRate,
      }
    });

    await tx.productVariant.create({
      data: {
        productId: product.id,
        size,
        price,
        stock,
        weightGrams,
        sku: finalVariantSku,
      }
    });
  });

  redirect('/admin/products');
}

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-8 text-[#212121] font-sans pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Add New Product</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Create a new organic catalog entry.</p>
        </div>
        <Link href="/admin/products" className="text-sm font-bold text-[#8D6E63] hover:text-[#212121] px-4 py-2 border border-[#E0E0E0] rounded-lg">
          Cancel & Return
        </Link>
      </div>

      <NewProductForm categories={categories} action={createProduct} />
    </div>
  );
}
