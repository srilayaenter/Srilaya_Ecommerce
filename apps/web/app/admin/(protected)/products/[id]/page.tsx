import { prisma } from "../../../../../lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>
}

async function updateProduct(productId: string, formData: FormData) {
  'use server';

  await prisma.product.update({
    where: { id: productId },
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      gstRate: parseFloat(formData.get('gstRate') as string),
      categoryId: formData.get('categoryId') as string,
      active: formData.get('active') === 'on',
    }
  });

  redirect(`/admin/products/${productId}`);
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
      stock: parseInt(formData.get('stock') as string),
    }
  });

  redirect(`/admin/products/${productId}`);
}

async function deleteVariant(formData: FormData) {
  'use server';

  const variantId = formData.get('variantId') as string;
  const productId = formData.get('productId') as string;

  await prisma.productVariant.delete({
    where: { id: variantId }
  });

  redirect(`/admin/products/${productId}`);
}

async function addVariant(formData: FormData) {
  'use server';

  const productId = formData.get('productId') as string;
  const size = formData.get('newSize') as string;
  const price = parseFloat(formData.get('newPrice') as string);
  const stock = parseInt(formData.get('newStock') as string);
  const sku = formData.get('newSku') as string;

  if (!size || !price || !sku) {
    redirect(`/admin/products/${productId}`);
  }

  await prisma.productVariant.create({
    data: {
      productId,
      size,
      price,
      stock: stock || 0,
      sku,
    }
  });

  redirect(`/admin/products/${productId}`);
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: { orderBy: { price: 'asc' } }
    }
  });

  if (!product) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const updateProductWithId = updateProduct.bind(null, product.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <Link href="/admin/products" className="text-indigo-600 hover:underline">
          ← Back to Products
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Product Details</h2>
          <form action={updateProductWithId} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                defaultValue={product.title}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                defaultValue={product.description || ''}
                className="w-full border rounded px-3 py-2"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="text"
                name="image"
                defaultValue={product.image || ''}
                className="w-full border rounded px-3 py-2"
                placeholder="/products/your-image.jpg or https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">GST Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="gstRate"
                  defaultValue={product.gstRate.toString()}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  name="categoryId"
                  defaultValue={product.categoryId}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={product.active}
                />
                <span className="text-sm font-medium">Active (visible to customers)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Save Product Details
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Size Variants</h2>

          <div className="space-y-3 mb-6">
            {product.variants.map(variant => (
              <div key={variant.id} className="border rounded-lg p-4">
                <form action={updateVariant} className="space-y-2">
                  <input type="hidden" name="variantId" value={variant.id} />
                  <input type="hidden" name="productId" value={product.id} />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Size</label>
                      <input
                        type="text"
                        name="size"
                        defaultValue={variant.size}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="price"
                        defaultValue={variant.price.toString()}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Stock</label>
                      <input
                        type="number"
                        name="stock"
                        defaultValue={variant.stock}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">SKU: {variant.sku}</p>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Update
                    </button>
                  </div>
                </form>

                <form action={deleteVariant} className="mt-2">
                  <input type="hidden" name="variantId" value={variant.id} />
                  <input type="hidden" name="productId" value={product.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Delete this variant
                  </button>
                </form>
              </div>
            ))}

            {product.variants.length === 0 && (
              <p className="text-gray-600 text-sm">No variants yet. Add one below.</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Add New Variant</h3>
            <form action={addVariant} className="space-y-3">
              <input type="hidden" name="productId" value={product.id} />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Size</label>
                  <input
                    type="text"
                    name="newSize"
                    placeholder="1kg"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="newPrice"
                    placeholder="189"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Stock</label>
                  <input
                    type="number"
                    name="newStock"
                    placeholder="100"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">SKU (must be unique)</label>
                <input
                  type="text"
                  name="newSku"
                  placeholder={`${product.sku}-NEW`}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 text-sm"
              >
                Add Variant
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}