import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { BRAND } from "@/lib/brand";
import PrintButton from "./PrintButton";

interface Props {
  params: { orderId: string };
  searchParams: { contact?: string };
}

export default async function InvoicePage({ params, searchParams }: Props) {
  const rawId  = params.orderId.replace(/^#/, "").toLowerCase();
  const contact = (searchParams.contact ?? "").trim().toLowerCase();

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: { startsWith: rawId } }, { id: rawId }] },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });

  if (!order) notFound();

  const emailMatch = order.email?.toLowerCase() === contact;
  const phoneMatch = order.phone?.replace(/\D/g, "").endsWith(contact.replace(/\D/g, ""));
  if (!emailMatch && !phoneMatch) notFound();

  const shortId   = order.id.slice(0, 8).toUpperCase();
  const invoiceNo = `SL-${shortId}`;
  const date      = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const items = order.items.map(i => ({
    title:    i.variant.product.title,
    size:     i.variant.size,
    quantity: i.quantity,
    price:    toNum(i.price),
    gstRate:  toNum(i.gstRate),
  }));

  const subtotal   = toNum(order.subtotal);
  const taxTotal   = toNum(order.taxTotal);
  const shippingFee = toNum(order.shippingFee);
  const total      = toNum(order.total);

  return (
    <div className="min-h-screen bg-[#F9F6F0] print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden bg-[#006A38] px-6 py-4 flex items-center justify-between">
        <p className="text-white font-bold text-sm">Invoice {invoiceNo}</p>
        <PrintButton />
      </div>

      {/* Invoice */}
      <div className="max-w-2xl mx-auto my-8 print:my-0 bg-white shadow-sm print:shadow-none rounded-2xl print:rounded-none p-8 print:p-6 font-sans text-[#212121]">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-[#E0E0E0]">
          <div>
            <p className="text-2xl font-black text-[#006A38]">{BRAND.name}</p>
            <p className="text-xs text-[#8D6E63] mt-0.5">{BRAND.tagline}</p>
            <p className="text-xs text-[#616161] mt-2 leading-relaxed">
              {BRAND.address}<br />
              GSTIN: {BRAND.gstin}<br />
              {BRAND.email} · {BRAND.phone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-[#212121]">TAX INVOICE</p>
            <p className="text-sm font-bold text-[#006A38] mt-1">{invoiceNo}</p>
            <p className="text-xs text-[#616161] mt-1">Date: {date}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9E9E] mb-1">Bill To</p>
          <p className="font-bold text-sm">{order.customerName}</p>
          <p className="text-xs text-[#616161]">{order.email}</p>
          {order.phone && <p className="text-xs text-[#616161]">{order.phone}</p>}
          {order.address && (
            <p className="text-xs text-[#616161] mt-0.5">
              {order.address}, {[order.city, order.state, order.zipCode].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-[#F5F5F5] text-[10px] uppercase tracking-wider text-[#9E9E9E]">
              <th className="text-left px-3 py-2 rounded-l-lg">Item</th>
              <th className="text-center px-3 py-2">Qty</th>
              <th className="text-right px-3 py-2">Rate</th>
              <th className="text-right px-3 py-2">GST</th>
              <th className="text-right px-3 py-2 rounded-r-lg">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {items.map((item, i) => {
              const baseAmount = item.price * item.quantity;
              const gstAmount  = baseAmount * (item.gstRate / 100);
              const lineTotal  = baseAmount + gstAmount;
              return (
                <tr key={i}>
                  <td className="px-3 py-3">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-[#8D6E63]">{item.size}</p>
                  </td>
                  <td className="px-3 py-3 text-center">{item.quantity}</td>
                  <td className="px-3 py-3 text-right">₹{item.price.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-[#8D6E63]">{item.gstRate}%</td>
                  <td className="px-3 py-3 text-right font-semibold">₹{lineTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-[#616161]">
              <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#616161]">
              <span>GST</span><span>₹{taxTotal.toFixed(2)}</span>
            </div>
            {shippingFee > 0 && (
              <div className="flex justify-between text-[#616161]">
                <span>Shipping</span><span>₹{shippingFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base pt-2 border-t border-[#006A38]">
              <span>Total</span><span className="text-[#006A38]">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div className="mt-8 pt-6 border-t border-[#E0E0E0] flex items-center justify-between text-xs text-[#9E9E9E]">
          <p>Payment: <span className="font-bold text-[#616161] capitalize">{order.paymentMethod?.replace("_", " ")}</span></p>
          <p>Order: <span className="font-mono font-bold text-[#616161]">#{shortId}</span></p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#9E9E9E]">
          <p>Thank you for shopping with {BRAND.name}!</p>
          <p className="mt-0.5">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}
