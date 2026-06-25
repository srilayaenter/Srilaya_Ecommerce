import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// 1. SERVER ACTION: SECURE PRODUCT CREATION
async function createProduct(formData: FormData) {
  'use server';

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const categoryId = formData.get('categoryId') as string;
  const isFeatured = formData.get('isFeatured') === 'on';
  const isActive = formData.get('isActive') === 'on';

  // Metadata
  const certification = formData.get('certification') as string;
  const shelfLife = formData.get('shelfLife') as string;
  const storage = formData.get('storage') as string;
  const nutritionalInfo = formData.get('nutritionalInfo') as string;

  // Variant Data
  const size        = formData.get('size') as string;
  const price       = parseFloat(formData.get('price') as string);
  const stock       = parseInt(formData.get('stock') as string, 10);
  const gstRate     = parseFloat(formData.get('gstRate') as string) || 0;
  const weightGrams = parseInt(formData.get('weightGrams') as string, 10) || 500;
  
  // SKU Generation
  const baseSku = formData.get('sku') as string;
  const finalSku = baseSku ? `${baseSku}-${Math.floor(Math.random() * 1000)}` : `PRD-${Date.now()}`;

  if (!title || !categoryId || isNaN(price) || isNaN(stock)) return;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        title,
        slug,
        description: `${description}\n\n**Certification:** ${certification}\n**Shelf Life:** ${shelfLife}\n**Storage:** ${storage}\n**Nutrition:** ${nutritionalInfo}`,
        categoryId,
        active: isActive,
        sku: finalSku,
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
        sku: finalSku,
      }
    });
  });

  redirect('/admin/products');
}

// 2. RENDER COMPONENT
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

      <form action={createProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
            <h2 className="font-semibold mb-4 border-b pb-2">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Title *</label>
                <input type="text" name="title" required className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select name="categoryId" required className="w-full border rounded-lg px-3 py-2 bg-white">
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST Rate (%) *</label>
                  <input type="number" name="gstRate" defaultValue="0" className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FFF8E1] rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
            <h2 className="font-semibold text-[#8D6E63] mb-4 border-b border-[#E0E0E0] pb-2">Packaging & Stock</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Weight/Size *</label>
                <input type="text" name="size" required placeholder="e.g. 1kg" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                <input type="number" name="price" required step="0.01" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Stock *</label>
                <input type="number" name="stock" required className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU *</label>
                <input type="text" name="sku" required className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (grams) *</label>
                <input type="number" name="weightGrams" required defaultValue="500" placeholder="e.g. 550" className="w-full border rounded-lg px-3 py-2" />
                <p className="text-xs text-slate-400 mt-1">Include packaging weight. Used to calculate shipping cost.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Status</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked /> Active Product</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" /> Featured</label>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#4CAF50] text-white py-3 rounded-lg font-bold hover:bg-[#388E3C]">
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
}