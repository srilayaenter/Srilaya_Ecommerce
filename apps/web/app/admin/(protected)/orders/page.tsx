import { prisma } from "../../../../lib/db";
import Link from "next/link";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          variant: { include: { product: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Orders</h1>

      <div className="space-y-4">
        {orders.map(order => {
          const total = parseFloat(order.total.toString());
          return (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.customerName} · {order.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">₹{total.toFixed(2)}</p>
                  <span className={`text-sm font-semibold capitalize ${
                    order.status === 'paid' ? 'text-green-600' :
                    order.status === 'pending' ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Items ({order.items.length}):</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {order.items.map(item => (
                    <li key={item.id}>
                      {item.variant.product.title} ({item.variant.size}) × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 mt-4">
                <Link href={`/orders/${order.id}`}>
                  <button className="text-indigo-600 hover:underline text-sm">
                    View Order
                  </button>
                </Link>
                <Link href={`/orders/${order.id}/invoice`}>
                  <button className="text-indigo-600 hover:underline text-sm">
                    View Invoice
                  </button>
                </Link>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <p className="text-gray-600 text-center py-8">No orders yet.</p>
        )}
      </div>
    </div>
  );
}