import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { toNum } from "@/lib/decimal";
import { BRAND } from "@/lib/brand";
import { buildWhatsAppInvoiceText } from "@/lib/emails/inStoreInvoice";
import InvoiceActions from "./InvoiceActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Cash', upi: 'UPI', card: 'Card (POS)', bank_transfer: 'Bank Transfer',
};

export default async function OrderInvoicePage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
      },
    },
  });

  if (!order) notFound();

  const items = order.items.map(i => ({
    title:    i.variant.product.title,
    size:     i.variant.size,
    quantity: i.quantity,
    price:    toNum(i.price),
    gstRate:  toNum(i.gstRate),
  }));

  const subtotal   = toNum(order.subtotal);
  const taxTotal   = toNum(order.taxTotal);
  const total      = toNum(order.total);
  const isInStore  = order.orderChannel === 'in_store';
  const invoiceNo  = order.invoiceNo?.startsWith('NOTE:') ? undefined : order.invoiceNo;

  const whatsappText = buildWhatsAppInvoiceText({
    customerName:  order.customerName ?? 'Customer',
    orderId:       order.id,
    items,
    total,
    paymentMethod: order.paymentMethod,
    createdAt:     order.createdAt,
  });

  // Strip phone to digits only for wa.me link
  const rawPhone = (order.phone ?? '').replace(/\D/g, '');
  const waPhone  = rawPhone.startsWith('91') ? rawPhone : rawPhone ? `91${rawPhone}` : '';
  const whatsappUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(whatsappText)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const dateStr = order.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = order.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="font-sans pb-12">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="text-sm text-[#006A38] font-bold hover:underline">← Orders</Link>
          <h1 className="text-xl font-bold text-[#212121]">Invoice / Receipt</h1>
          {isInStore && (
            <span className="text-xs bg-[#FF9800]/10 text-[#E65100] font-bold px-2 py-1 rounded-full">In-Store</span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Invoice document */}
        <div id="invoice-doc" className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">

          {/* Header */}
          <div className="bg-[#006A38] px-8 py-6 flex justify-between items-start">
            <div>
              <h2 className="text-white font-black text-xl">{BRAND.name}</h2>
              <p className="text-[#FFF8E1] text-xs mt-1">GSTIN: {BRAND.gstin}</p>
              <p className="text-[#FFF8E1] text-xs">{BRAND.address}</p>
              <p className="text-[#FFF8E1] text-xs">{BRAND.phone} · {BRAND.email}</p>
            </div>
            <div className="text-right">
              <div className="bg-[#FFF8E1] text-[#006A38] font-black text-xs px-3 py-1.5 rounded-full tracking-widest uppercase">
                {isInStore ? 'In-Store Receipt' : 'Invoice'}
              </div>
              <p className="text-[#FFF8E1] text-xs mt-2">#{order.id.slice(0, 8).toUpperCase()}</p>
              {invoiceNo && <p className="text-[#FFF8E1] text-xs">{invoiceNo}</p>}
            </div>
          </div>

          {/* Meta row */}
          <div className="px-8 py-4 bg-[#F9F9F9] border-b border-[#E0E0E0] grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div><span className="text-[#9E9E9E] font-bold uppercase tracking-wide">Customer</span></div>
              <div className="font-bold text-[#212121] text-sm">{order.customerName ?? '—'}</div>
              {order.phone && <div className="text-[#616161]">{order.phone}</div>}
              {order.email && <div className="text-[#616161]">{order.email}</div>}
            </div>
            <div className="space-y-1 text-right">
              <div><span className="text-[#9E9E9E] font-bold uppercase tracking-wide">Date</span></div>
              <div className="font-bold text-[#212121]">{dateStr}</div>
              <div className="text-[#616161]">{timeStr}</div>
              <div className="mt-2">
                <span className="bg-[#E8F5E9] text-[#2E7D32] font-bold text-xs px-2.5 py-1 rounded-full">
                  ✓ PAID · {PAYMENT_LABEL[order.paymentMethod ?? ''] ?? order.paymentMethod ?? 'In-Store'}
                </span>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="px-8 py-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F5F5F5] text-[10px] uppercase font-bold text-[#9E9E9E] tracking-wider">
                  <th className="px-3 py-2.5 text-left">Item</th>
                  <th className="px-3 py-2.5 text-center">Qty</th>
                  <th className="px-3 py-2.5 text-right">Rate</th>
                  <th className="px-3 py-2.5 text-right">GST</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[#212121]">{item.title}</div>
                      <div className="text-xs text-[#8D6E63]">Size: {item.size}</div>
                    </td>
                    <td className="px-3 py-3 text-center">{item.quantity}</td>
                    <td className="px-3 py-3 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-[#616161]">
                      ₹{(item.price * item.quantity * item.gstRate / 100).toFixed(2)}
                      <span className="block text-[10px] text-[#9E9E9E]">{item.gstRate}%</span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-[#212121]">
                      ₹{(item.price * item.quantity * (1 + item.gstRate / 100)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <table className="text-sm w-64">
                <tbody className="divide-y divide-[#F0F0F0]">
                  <tr>
                    <td className="py-2 text-[#616161]">Subtotal (excl. GST)</td>
                    <td className="py-2 text-right">₹{subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#616161]">GST</td>
                    <td className="py-2 text-right">₹{taxTotal.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t-2 border-[#006A38]">
                    <td className="py-2.5 font-black text-[#212121] text-base">Total Paid</td>
                    <td className="py-2.5 text-right font-black text-[#006A38] text-base">₹{total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {order.invoiceNo?.startsWith('NOTE:') && (
              <div className="mt-4 bg-[#FFF8E1] rounded-lg px-4 py-3 text-xs text-[#8D6E63]">
                <strong>Note:</strong> {order.invoiceNo.replace('NOTE:', '')}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-[#F5F5F5] border-t border-[#E0E0E0] text-center text-xs text-[#9E9E9E]">
            <p>Thank you for shopping with <strong className="text-[#006A38]">{BRAND.name}</strong>!</p>
            <p className="mt-1">This is a computer-generated receipt and does not require a signature.</p>
          </div>
        </div>

        {/* Actions panel — hidden on print */}
        <div className="print:hidden">
          <InvoiceActions
            orderId={order.id}
            defaultEmail={order.email ?? ''}
            whatsappUrl={whatsappUrl}
          />
        </div>
      </div>
    </div>
  );
}
