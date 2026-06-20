import { prisma } from "../../../../lib/db";
import Link from "next/link";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: { orderBy: { price: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Products</h1>
        <Link href="/admin/products/new">
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
            Add New Product
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map(product => {
              const prices = product.variants.map(v => parseFloat(v.price.toString()));
              const minPrice = prices.length ? Math.min(...prices) : 0;
              const maxPrice = prices.length ? Math.max(...prices) : 0;
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{product.title}</div>
                    <div className="text-sm text-gray-500">{product.sku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.variants.length} size{product.variants.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {minPrice === maxPrice ? `₹${minPrice.toFixed(2)}` : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={totalStock > 0 ? 'text-green-600' : 'text-red-600'}>
                      {totalStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/products/${product.id}`}>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="text-center text-gray-600 py-8">No products yet. Add your first one!</p>
        )}
      </div>
    </div>
  );
}