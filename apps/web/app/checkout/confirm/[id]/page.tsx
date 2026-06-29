import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { toNum } from "@/lib/decimal";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

interface Props { params: Promise<{ id: string }> }

export default async function CodConfirmPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });

  if (!order || order.status !== 'cod_pending') notFound();

  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">

        {/* Success card */}
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-[#006A38]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🛵</span>
          </div>
          <h1 className="text-2xl font-black text-[#212121]">Order Confirmed!</h1>
          <p className="text-[#8D6E63] text-sm mt-2">
            Your order has been placed. Pay <strong>₹{toNum(order.total).toFixed(2)}</strong> in cash when your order arrives.
          </p>
          <div className="mt-4 bg-[#F5F5F5] rounded-xl px-4 py-3 inline-block">
            <p className="text-xs text-[#9E9E9E] uppercase font-bold tracking-wider">Order ID</p>
            <p className="text-xl font-black text-[#006A38] font-mono">#{shortId}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#212121] mb-4">Items Ordered</h2>
          <div className="divide-y divide-[#F5F5F5]">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold text-[#212121]">{item.variant.product.title}</p>
                  <p className="text-xs text-[#8D6E63]">{item.variant.size} × {item.quantity}</p>
                </div>
                <p className="font-bold">₹{(toNum(item.price) * item.quantity * (1 + toNum(item.gstRate) / 100)).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E0E0E0] mt-2 pt-3 flex justify-between font-black text-base">
            <span>Total (Pay on Delivery)</span>
            <span className="text-[#006A38]">₹{toNum(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-5 text-sm text-[#8D6E63]">
          <p className="font-bold text-[#212121] mb-1">What happens next?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Our team will process your order within 24 hours.</li>
            <li>You'll receive a dispatch notification via WhatsApp/email.</li>
            <li>Keep ₹{toNum(order.total).toFixed(2)} ready for the delivery person.</li>
          </ul>
        </div>

        <div className="text-center space-y-3">
          <Link
            href={`/track?orderId=${order.id}&contact=${encodeURIComponent(order.email ?? '')}`}
            className="block w-full bg-[#006A38] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#00522B] transition-colors"
          >
            Track My Order
          </Link>
          <Link href="/product" className="block text-sm text-[#006A38] font-bold hover:underline">
            Continue Shopping →
          </Link>
        </div>

        <p className="text-center text-xs text-[#9E9E9E]">
          Questions? Call <a href={`tel:${BRAND.phone}`} className="text-[#006A38] font-bold">{BRAND.phone}</a>
        </p>
      </div>
    </div>
  );
}
