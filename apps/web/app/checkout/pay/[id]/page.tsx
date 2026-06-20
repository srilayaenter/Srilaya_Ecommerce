import { prisma } from "../../../../lib/db";
import { notFound, redirect } from "next/navigation";
import { toNum } from "../../../../lib/decimal";
import PayButton from "./PayButton";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PayPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { variant: { include: { product: true } } }
      }
    }
  });

  if (!order) {
    notFound();
  }

  if (order.status === 'paid') {
    redirect(`/orders/${order.id}`);
  }

  const total = toNum(order.total);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
        <p className="text-gray-600 mb-6">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Amount to pay</p>
          <p className="text-3xl font-bold text-indigo-600">₹{total.toFixed(2)}</p>
        </div>

        <div className="text-left text-sm text-gray-600 mb-6 space-y-1">
          {order.items.map(item => (
            <p key={item.id}>
              {item.variant.product.title} ({item.variant.size}) × {item.quantity}
            </p>
          ))}
        </div>

        <PayButton
          orderId={order.id}
          amount={total}
          customerName={order.customerName || ''}
          customerEmail={order.email || ''}
          customerPhone={order.phone || ''}
        />

        <p className="text-xs text-gray-500 mt-4">
          Your stock has been reserved for this order. If payment isn't completed,
          please contact us to release the reservation.
        </p>
      </div>
    </div>
  );
}