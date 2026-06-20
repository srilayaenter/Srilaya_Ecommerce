import { prisma } from "../../../../../lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

async function createProduct(formData: FormData) {
  'use server';

  const title = formData.get('title') as string;
  const slug = title.toLowerCase().replace(/\s+/g, '-');

  const product = await prisma.product.create({
    data: {
      slug,
      title,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      gstRate: parseFloat(formData.get('gstRate') as string) || 5,
      sku: formData.get('sku') as string,
      categoryId: formData.get('categoryId') as string,
      active: true,
      rating: 4.5,
      reviews: 0,
    }
  });

  const size = formData.get('size') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string) || 0;

  if (size && price) {
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        size,
        price,
        stock,
        sku: `${product.sku}-${size.toUpperCase()}`,
      }
    });
  }

  redirect(`/admin/products/${product.id}`);
}

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <Link href="/admin/products" className="text-indigo-600 hover:underline">
          ← Back to Products
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={createProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              name="title"
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Foxtail Millet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Organic foxtail millet grains for daily nutrition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SKU (base) *</label>
              <input
                type="text"
                name="sku"
                required
                className="w-full border rounded px-3 py-2"
                placeholder="FM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                name="categoryId"
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <input
              type="text"
              name="image"
              className="w-full border rounded px-3 py-2"
              placeholder="/products/foxtail-millet.jpg or https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">GST Rate (%)</label>
            <input
              type="number"
              step="0.01"
              name="gstRate"
              defaultValue="5"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">First Size Variant (you can add more after creating)</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Size</label>
                <input
                  type="text"
                  name="size"
                  className="w-full border rounded px-2 py-2 text-sm"
                  placeholder="1kg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  className="w-full border rounded px-2 py-2 text-sm"
                  placeholder="189"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stock</label>
                <input
                  type="number"
                  name="stock"
                  className="w-full border rounded px-2 py-2 text-sm"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Create Product
          </button>
        </form>
      </div>
    </div>
  );
}