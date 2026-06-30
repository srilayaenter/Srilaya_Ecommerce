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
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Hi! I just ordered from SriLaYa Enterprises 🌾\nOrder #${shortId} — ₹${toNum(order.total).toFixed(2)} (Pay on Delivery)\n\nTrack my order: ${process.env.NEXTAUTH_URL ?? 'https://srilaya.com'}/track?orderId=${order.id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border-2 border-[#25D366] text-[#25D366] font-bold py-3 rounded-xl text-sm hover:bg-[#25D366]/5 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share on WhatsApp
          </a>
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
