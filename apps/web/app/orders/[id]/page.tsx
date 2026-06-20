import { prisma } from "../../../lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id: id },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const subtotal = parseFloat(order.subtotal.toString());
  const taxTotal = parseFloat(order.taxTotal.toString());
  const shippingFee = parseFloat(order.shippingFee.toString());
  const total = parseFloat(order.total.toString());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-lg p-6 mb-8 text-center border ${
          order.status === 'paid'
            ? 'bg-green-50 border-green-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            order.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'
          }`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${order.status === 'paid' ? 'text-green-800' : 'text-orange-800'}`}>
            {order.status === 'paid' ? 'Order Confirmed!' : 'Order Created — Payment Pending'}
          </h1>
          <p className={order.status === 'paid' ? 'text-green-700' : 'text-orange-700'}>
            {order.status === 'paid'
              ? "Thank you for your order. We'll send you a confirmation email shortly."
              : 'If you completed payment and still see this, please refresh in a moment.'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6 pb-6 border-b">
            <div>
              <h2 className="text-2xl font-bold mb-2">Order Details</h2>
              <p className="text-sm text-gray-600">Order ID: <span className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span></p>
              <p className="text-sm text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p className="text-sm text-gray-600">
                Status: <span className={`font-semibold capitalize ${
                  order.status === 'paid' ? 'text-green-600' :
                  order.status === 'pending' ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {order.status}
                </span>
              </p>
            </div>
            <Link href={`/orders/${order.id}/invoice`}>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Invoice
              </button>
            </Link>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Shipping Address</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-gray-600">{order.email}</p>
              {order.phone && <p className="text-gray-600">{order.phone}</p>}
              <p className="text-gray-600 mt-2">{order.address}</p>
              <p className="text-gray-600">{order.city}, {order.state} - {order.zipCode}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => {
                const itemPrice = parseFloat(item.price.toString());
                const itemTotal = itemPrice * item.quantity;

                return (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    {item.variant.product.image && (
                      <img
                        src={item.variant.product.image}
                        alt={item.variant.product.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.variant.product.title}</h4>
                      <p className="text-sm text-gray-600">Size: {item.variant.size}</p>
                      <p className="text-sm text-gray-600">SKU: {item.variant.sku}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{itemPrice.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Total: ₹{itemTotal.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST:</span>
                  <span className="font-semibold">₹{taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">{shippingFee === 0 ? 'Free' : `₹${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-indigo-600">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/category/millets">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold">
              Continue Shopping
            </button>
          </Link>
          <Link href={`/orders/${order.id}/invoice`}>
            <button className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold">
              Download Invoice
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}