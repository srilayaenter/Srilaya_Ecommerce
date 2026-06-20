import { prisma } from "../../../lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const orderCount = await prisma.order.count();
  const pendingOrders = await prisma.order.count({ where: { status: 'pending' } });

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-1">Total Products</p>
          <p className="text-3xl font-bold">{productCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-1">Total Variants</p>
          <p className="text-3xl font-bold">{variantCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold">{orderCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-1">Pending Orders</p>
          <p className="text-3xl font-bold text-orange-600">{pendingOrders}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/products">
          <div className="bg-indigo-600 text-white rounded-lg shadow p-6 hover:bg-indigo-700 transition cursor-pointer">
            <h3 className="font-semibold text-lg mb-1">Manage Products</h3>
            <p className="text-indigo-100 text-sm">Add, edit, or remove products and variants</p>
          </div>
        </Link>
        <Link href="/admin/orders">
          <div className="bg-indigo-600 text-white rounded-lg shadow p-6 hover:bg-indigo-700 transition cursor-pointer">
            <h3 className="font-semibold text-lg mb-1">View Orders</h3>
            <p className="text-indigo-100 text-sm">Track and manage customer orders</p>
          </div>
        </Link>
        <Link href="/admin/categories">
          <div className="bg-indigo-600 text-white rounded-lg shadow p-6 hover:bg-indigo-700 transition cursor-pointer">
            <h3 className="font-semibold text-lg mb-1">Manage Categories</h3>
            <p className="text-indigo-100 text-sm">Organize your product categories</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-indigo-600 hover:underline text-sm">
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-600">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => {
              const total = parseFloat(order.total.toString());
              return (
                <Link key={order.id} href={`/admin/orders`}>
                  <div className="flex justify-between items-center py-3 border-b last:border-b-0 hover:bg-gray-50 px-2 rounded">
                    <div>
                      <p className="font-medium">{order.customerName || 'Guest'}</p>
                      <p className="text-sm text-gray-600">
                        {order.id.slice(0, 8).toUpperCase()} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{total.toFixed(2)}</p>
                      <span className={`text-xs font-semibold capitalize ${
                        order.status === 'paid' ? 'text-green-600' :
                        order.status === 'pending' ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}