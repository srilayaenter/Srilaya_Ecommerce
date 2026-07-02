import { prisma } from "../../../../lib/db";
import { redirect } from "next/navigation";

async function createCategory(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const slug = name.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  const image = formData.get('image') as string;

  await prisma.category.create({
    data: { name, slug, image: image || null }
  });

  redirect('/admin/categories');
}

async function updateCategorySlug(formData: FormData) {
  'use server';
  const id   = formData.get('categoryId') as string;
  const slug = (formData.get('slug') as string).toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  await prisma.category.update({ where: { id }, data: { slug } });
  redirect('/admin/categories');
}

async function deleteCategory(formData: FormData) {
  'use server';
  const categoryId = formData.get('categoryId') as string;
  await prisma.category.delete({ where: { id: categoryId } });
  redirect('/admin/categories');
}

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
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
            {categories.map(category => {
              const hasSpecialChar = /[^a-z0-9-]/.test(category.slug);
              const isEditing = edit === category.id;
              return (
                <div key={category.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {category.image && (
                        <img src={category.image} alt={category.name} className="w-10 h-10 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
                          /{category.slug}
                          {hasSpecialChar && (
                            <span className="text-red-500 font-bold ml-1">⚠ invalid slug</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">{category._count.products} products</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`?edit=${category.id}`} className="text-xs text-[#006A38] font-bold hover:underline">
                        Edit slug
                      </a>
                      <form action={deleteCategory}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <button
                          type="submit"
                          disabled={category._count.products > 0}
                          className="text-red-600 hover:text-red-700 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                          title={category._count.products > 0 ? "Can't delete — has products" : "Delete"}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  {isEditing && (
                    <form action={updateCategorySlug} className="flex gap-2 items-center pt-1">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input
                        type="text"
                        name="slug"
                        defaultValue={category.slug}
                        className="flex-1 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-[#006A38]"
                        placeholder="muesli-and-granola"
                      />
                      <button type="submit" className="bg-[#006A38] text-white px-3 py-1 rounded text-sm font-bold hover:bg-[#00522B]">
                        Save
                      </button>
                      <a href="/admin/categories" className="text-sm text-gray-400 hover:text-gray-600">Cancel</a>
                    </form>
                  )}
                </div>
              );
            })}

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
              className="w-full bg-[#006A38] text-white py-3 rounded-lg font-semibold hover:bg-[#00522B]"
            >
              Add Category
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}