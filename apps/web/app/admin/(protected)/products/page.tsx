import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import Link from "next/link";

export default async function InventoryMatrixPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Inventory Matrix</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Manage your millet product catalog and stock levels.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="bg-[#006A38] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00522B] transition-colors"
        >
          + Add New Product
        </Link>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F5F5F5] border-b border-[#E0E0E0]">
            <tr className="text-[11px] font-bold uppercase text-[#9E9E9E] tracking-wider">
              <th className="px-6 py-4">Product Details</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Stock Matrix</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-[#FFF8E1]/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-[#212121]">{product.title}</div>
                  <div className={`text-[10px] uppercase font-bold mt-1 ${product.active ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
                    {product.active ? '● Active' : '● Inactive'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#424242]">
                  {product.category?.name || "—"}
                </td>
                <td className="px-6 py-4">
                  {product.variants.map((v) => (
                    <div key={v.id} className="flex items-center gap-4 text-xs py-1">
                      <span className="font-mono text-[#8D6E63] w-12">{v.size}</span>
                      <span className="font-bold text-[#006A38] w-16">₹{toNum(v.price).toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded border ${v.stock <= ((v as any).reorderThreshold ?? 10) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                        {v.stock} in stock
                      </span>
                      {v.stock <= ((v as any).reorderThreshold ?? 10) && (
                        <span className="text-[10px] text-red-500 font-semibold">↓ reorder</span>
                      )}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin/products/${product.id}`}
                    className="text-[#006A38] font-bold hover:underline text-sm"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}