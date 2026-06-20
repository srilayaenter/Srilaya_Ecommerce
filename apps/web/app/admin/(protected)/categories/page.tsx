import { prisma } from "../../../../lib/db";
import { redirect } from "next/navigation";

async function createCategory(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const image = formData.get('image') as string;

  await prisma.category.create({
    data: { name, slug, image: image || null }
  });

  redirect('/admin/categories');
}

async function deleteCategory(formData: FormData) {
  'use server';

  const categoryId = formData.get('categoryId') as string;
  await prisma.category.delete({ where: { id: categoryId } });

  redirect('/admin/categories');
}

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Categories</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Categories</h2>
          <div className="space-y-3">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {category.image && (
                    <img src={category.image} alt={category.name} className="w-12 h-12 object-cover rounded" />
                  )}
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-gray-600">{category._count.products} products</p>
                  </div>
                </div>
                <form action={deleteCategory}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <button
                    type="submit"
                    disabled={category._count.products > 0}
                    className="text-red-600 hover:text-red-700 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                    title={category._count.products > 0 ? "Can't delete a category with products" : "Delete"}
                  >
                    Delete
                  </button>
                </form>
              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-gray-600">No categories yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
          <form action={createCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                name="name"
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Pulses"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="text"
                name="image"
                className="w-full border rounded px-3 py-2"
                placeholder="/categories/pulses.jpg or https://..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Add Category
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}