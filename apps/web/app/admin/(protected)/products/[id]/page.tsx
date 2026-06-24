import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import StyledSelect from "@/components/StyledSelect";

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
  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      size: formData.get('size') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string, 10),
    }
  });
  redirect(`/admin/products/${productId}?saved=true&variant=true`);
}

async function addVariant(formData: FormData) {
  'use server';
  const productId = formData.get('productId') as string;
  await prisma.productVariant.create({
    data: {
      productId,
      size: formData.get('newSize') as string,
      price: parseFloat(formData.get('newPrice') as string),
      stock: parseInt(formData.get('newStock') as string, 10),
      sku: formData.get('newSku') as string,
    }
  });
  redirect(`/admin/products/${productId}?saved=true&variant=added`);
}

export default async function EditProductPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { saved, variant } = await searchParams;
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
      {saved === 'true' && (
        <div className="bg-[#006A38]/10 border border-[#006A38]/30 text-[#006A38] px-4 py-3 rounded-lg mb-6 font-semibold text-sm">
          {variant === 'true' && '✓ Variant updated successfully.'}
          {variant === 'added' && '✓ New variant added successfully.'}
          {!variant && '✓ Changes saved successfully.'}
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
          {product.variants.map(variant => (
            <div key={variant.id} className="border-b py-4">
              <form action={updateVariant} className="grid grid-cols-4 gap-2 items-end">
                <input type="hidden" name="variantId" value={variant.id} />
                <input type="hidden" name="productId" value={product.id} />
                <input type="text" name="size" defaultValue={variant.size} className="border rounded px-2 py-1 text-sm" />
                <input type="number" step="0.01" name="price" defaultValue={variant.price.toString()} className="border rounded px-2 py-1 text-sm" />
                <input type="number" name="stock" defaultValue={variant.stock} className="border rounded px-2 py-1 text-sm" />
                <button type="submit" className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">Update</button>
              </form>
            </div>
          ))}
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-3">Add New Variant</h3>
            <form action={addVariant} className="grid grid-cols-2 gap-2">
              <input type="hidden" name="productId" value={product.id} />
              <input name="newSize" placeholder="Size (e.g 500g)" className="border rounded px-2 py-1 text-sm" required />
              <input type="number" step="0.01" name="newPrice" placeholder="Price" className="border rounded px-2 py-1 text-sm" required />
              <input type="number" name="newStock" placeholder="Stock" className="border rounded px-2 py-1 text-sm" required />
              <input name="newSku" placeholder="Unique SKU" className="border rounded px-2 py-1 text-sm" required />
              <button type="submit" className="col-span-2 bg-[#4CAF50] text-white py-2 rounded-lg text-sm font-bold">Add Variant</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}