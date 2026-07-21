import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import StyledSelect from "@/components/StyledSelect";
import ImageManager from "./ImageManager";
import MainImageUploader from "./MainImageUploader";
import DeleteVariantButton from "./DeleteVariantButton";
import { logStockChange } from "@/lib/stockLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; variant?: string }>;
}

// SERVER ACTIONS
async function updateProduct(productId: string, formData: FormData) {
  'use server';
  const supplierId = formData.get('supplierId') as string;
  await prisma.product.update({
    where: { id: productId },
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      gstRate: parseFloat(formData.get('gstRate') as string) || 0,
      categoryId: formData.get('categoryId') as string,
      supplierId: supplierId || null,
      active: formData.get('active') === 'on',
    }
  });
  redirect(`/admin/products/${productId}?saved=true`);
}

async function updateVariant(formData: FormData) {
  'use server';
  const variantId = formData.get('variantId') as string;
  const productId = formData.get('productId') as string;
  const newStock  = parseInt(formData.get('stock') as string, 10);

  const before = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { stock: true, sku: true } });

  const costPriceRaw = parseFloat(formData.get('costPrice') as string);
  const hasCostField = formData.has('costPrice');
  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      size:             formData.get('size') as string,
      price:            parseFloat(formData.get('price') as string),
      // Only update costPrice if the field was present in the form (owner only)
      ...(hasCostField && { costPrice: !isNaN(costPriceRaw) && costPriceRaw > 0 ? costPriceRaw : null }),
      stock:            newStock,
      weightGrams:      parseInt(formData.get('weightGrams') as string, 10) || 500,
      reorderThreshold: parseInt(formData.get('reorderThreshold') as string, 10) || 10,
      imageUrl:         (formData.get('imageUrl') as string)?.trim() || null,
    }
  });

  // Log stock change if stock value was modified
  if (before && before.stock !== newStock) {
    logStockChange({
      variantId,
      sku:    before.sku,
      delta:  newStock - before.stock,
      reason: "manual_edit",
      note:   `admin edit`,
    }).catch(() => {});
  }

  // If stock went from 0 to >0, fire stock notifications
  if (before && before.stock === 0 && newStock > 0) {
    const { sendStockNotifications } = await import('@/lib/stockNotifications');
    sendStockNotifications(variantId).catch(() => {});
  }

  redirect(`/admin/products/${productId}?saved=true&variant=true`);
}

async function addVariant(formData: FormData) {
  'use server';
  const productId = formData.get('productId') as string;
  const size = formData.get('newSize') as string;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sku: true }
  });

  const generatedSku = `${product?.sku}-${size.toUpperCase().replace(/\s+/g, '')}`;

  await prisma.productVariant.create({
    data: {
      productId,
      size,
      price:            parseFloat(formData.get('newPrice') as string),
      stock:            parseInt(formData.get('newStock') as string, 10),
      weightGrams:      parseInt(formData.get('newWeightGrams') as string, 10) || 500,
      reorderThreshold: parseInt(formData.get('newReorderThreshold') as string, 10) || 10,
      sku:              generatedSku,
    }
  });
  redirect(`/admin/products/${productId}?saved=true&variant=added`);
}

async function deleteVariant(formData: FormData) {
  'use server';
  const variantId = formData.get('variantId') as string;
  const productId = formData.get('productId') as string;

  const count = await prisma.productVariant.count({ where: { productId } });
  if (count <= 1) redirect(`/admin/products/${productId}?saved=true&variant=last`);

  // Block if variant is part of any placed order (preserves order history)
  const orderedCount = await prisma.orderItem.count({ where: { variantId } });
  if (orderedCount > 0) redirect(`/admin/products/${productId}?saved=true&variant=inorder`);

  // Remove ephemeral cart references first, then delete
  await prisma.cartItem.deleteMany({ where: { variantId } });
  await prisma.bundleItem.deleteMany({ where: { variantId } });
  await prisma.stockLog.deleteMany({ where: { variantId } });
  await prisma.productVariant.delete({ where: { id: variantId } });
  redirect(`/admin/products/${productId}?saved=true&variant=deleted`);
}

async function toggleVariantActive(formData: FormData) {
  'use server';
  const variantId = formData.get('variantId') as string;
  const productId = formData.get('productId') as string;
  const current   = formData.get('active') === 'true';
  await prisma.productVariant.update({ where: { id: variantId }, data: { active: !current } });
  redirect(`/admin/products/${productId}?saved=true&variant=${current ? 'deactivated' : 'activated'}`);
}

export default async function EditProductPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { saved, variant } = await searchParams;
  const session = await getServerSession(authOptions);
  const showCostPrice = isOwner(session?.user?.role ?? '');
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, supplier: true, variants: { orderBy: { price: 'asc' } } }
  });

  if (!product) notFound();

  const allCategories = await prisma.category.findMany({
    include: { children: true },
    orderBy: { name: 'asc' }
  });
  const categories = allCategories.filter(cat => cat.children.length === 0);
  const suppliers = await prisma.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  const updateProductWithId = updateProduct.bind(null, product.id);

  return (
    <div className="container mx-auto px-6 py-8">
      {saved === 'true' && variant !== 'last' && (
        <div className="bg-[#006A38]/10 border border-[#006A38]/30 text-[#006A38] px-4 py-3 rounded-lg mb-6 font-semibold text-sm">
          {variant === 'true' && '✓ Variant updated successfully.'}
          {variant === 'added' && '✓ New variant added successfully.'}
          {variant === 'deleted' && '✓ Variant deleted successfully.'}
          {!variant && '✓ Changes saved successfully.'}
        </div>
      )}
      {saved === 'true' && variant === 'last' && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-6 font-semibold text-sm">
          ⚠ Cannot delete — a product must have at least one variant.
        </div>
      )}
      {saved === 'true' && variant === 'inorder' && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-6 font-semibold text-sm">
          ⚠ Cannot delete — this variant has been ordered by customers. Use &quot;Deactivate&quot; to hide it from the store instead.
        </div>
      )}
      {saved === 'true' && variant === 'deactivated' && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-6 font-semibold text-sm">
          ✓ Variant deactivated — hidden from the store. You can reactivate it anytime.
        </div>
      )}
      {saved === 'true' && variant === 'activated' && (
        <div className="bg-[#006A38]/10 border border-[#006A38]/30 text-[#006A38] px-4 py-3 rounded-lg mb-6 font-semibold text-sm">
          ✓ Variant reactivated — now visible on the store.
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-poppins text-[#212121]">Edit Product</h1>
        {/* SAFE CANCEL LINK */}
        <Link href="/admin/products" className="bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#424242] px-4 py-2 rounded-lg font-bold text-sm">
          Cancel & Return
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* DETAILS FORM */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <form action={updateProductWithId} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" name="title" defaultValue={product.title} required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" defaultValue={product.description || ''} className="w-full border rounded-lg px-3 py-2" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">GST Rate (%)</label>
                <input type="number" step="0.01" name="gstRate" defaultValue={product.gstRate.toString()} required className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <StyledSelect
                  name="categoryId"
                  defaultValue={product.categoryId}
                  options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <StyledSelect
                name="supplierId"
                defaultValue={product.supplierId || ""}
                placeholder="No supplier assigned"
                options={[
                  { value: "", label: "No supplier assigned" },
                  ...suppliers.map(s => ({ value: s.id, label: s.name }))
                ]}
              />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={product.active} /> Active</label>
            <button type="submit" className="w-full bg-[#006A38] text-white py-3 rounded-lg font-bold hover:bg-[#00522B]">Save Changes</button>
          </form>
        </div>

        {/* VARIANTS SECTION */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
          <div className={`grid gap-2 mb-1 px-0 ${showCostPrice ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Size</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Price ₹</span>
            {showCostPrice && <span className="text-[10px] font-bold text-slate-400 uppercase">Cost ₹</span>}
            <span className="text-[10px] font-bold text-slate-400 uppercase">Stock</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Wt (g)</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Reorder</span>
            <span />
          </div>
          {product.variants.map(variant => (
            <div key={variant.id} className="border-b py-3">
              <form action={updateVariant} className={`grid gap-2 items-center ${showCostPrice ? 'grid-cols-7' : 'grid-cols-6'}`}>
                <input type="hidden" name="variantId" value={variant.id} />
                <input type="hidden" name="productId" value={product.id} />
                <input type="text"   name="size"             defaultValue={variant.size}              className="border rounded px-2 py-1 text-sm" />
                <input type="number" name="price"            defaultValue={variant.price.toString()}  step="0.01" className="border rounded px-2 py-1 text-sm" />
                {showCostPrice && <input type="number" name="costPrice" defaultValue={(variant as any).costPrice?.toString() ?? ""} step="0.01" placeholder="—" title="Internal cost price (not shown to customers)" className="border rounded px-2 py-1 text-sm" />}
                <input type="number" name="stock"            defaultValue={variant.stock}             className="border rounded px-2 py-1 text-sm" />
                <input type="number" name="weightGrams"      defaultValue={(variant as any).weightGrams ?? 500} placeholder="e.g. 550" className="border rounded px-2 py-1 text-sm" />
                <input type="number" name="reorderThreshold" defaultValue={(variant as any).reorderThreshold ?? 10} placeholder="10" className="border rounded px-2 py-1 text-sm" title="Alert when stock falls to this level" />
                <input name="imageUrl" defaultValue={(variant as any).imageUrl ?? ""} placeholder="Variant image URL (optional)" className="border rounded px-2 py-1 text-sm col-span-full" title="Image shown when this variant is selected on the product page" />
                <div className="flex gap-1">
                  <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs font-bold transition-colors">Update</button>
                </div>
              </form>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(variant as any).active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {(variant as any).active !== false ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-3">
                  <form action={toggleVariantActive}>
                    <input type="hidden" name="variantId" value={variant.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="active" value={String((variant as any).active !== false)} />
                    <button type="submit" className={`text-xs underline ${(variant as any).active !== false ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'}`}>
                      {(variant as any).active !== false ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </form>
                  <DeleteVariantButton
                    variantId={variant.id}
                    productId={product.id}
                    action={deleteVariant}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-3">Add New Variant</h3>
            <p className="text-xs text-[#9E9E9E] mb-2">SKU will be generated automatically from the product code and size.</p>
            <form key={Date.now()} action={addVariant} className="grid grid-cols-2 gap-2" autoComplete="off">
              <input type="hidden" name="productId" value={product.id} />
              <input name="newSize"                   placeholder="Size (e.g. 500g)"      autoComplete="off" className="border rounded px-2 py-1 text-sm" required />
              <input type="number" step="0.01" name="newPrice"        placeholder="Price (₹)"            autoComplete="off" className="border rounded px-2 py-1 text-sm" required />
              <input type="number" name="newStock"        placeholder="Stock qty"            autoComplete="off" className="border rounded px-2 py-1 text-sm" required />
              <input type="number" name="newWeightGrams"  placeholder="Weight (g, e.g. 550)" autoComplete="off" className="border rounded px-2 py-1 text-sm" required />
              <input type="number" name="newReorderThreshold" placeholder="Reorder at (default 10)" autoComplete="off" className="border rounded px-2 py-1 text-sm col-span-2" />
              <button type="submit" className="col-span-2 bg-[#4CAF50] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#388E3C] transition-colors">Add Variant</button>
            </form>
          </div>
        </div>
      </div>

      {/* Image gallery manager */}
      <div className="mt-8">
        <MainImageUploader productId={product.id} currentImage={(product as any).image ?? null} />
        <ImageManager productId={product.id} />
      </div>
    </div>
  );
}