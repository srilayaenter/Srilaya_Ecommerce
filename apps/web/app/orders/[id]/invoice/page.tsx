import { prisma } from "../../../../lib/db";
import { BRAND } from "../../../../lib/brand";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InvoicePage({ params }: PageProps) {
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
  const gstAmount = parseFloat(order.taxTotal.toString());
  const shippingFee = parseFloat(order.shippingFee.toString());
  const total = parseFloat(order.total.toString());

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          header, footer, nav {
            display: none !important;
          }
        }
      `}} />

      <div className="container mx-auto px-4 py-8 print-container">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#006A38] mb-2">{BRAND.name}</h1>
              <p className="text-sm text-gray-600 mt-2">{BRAND.address}</p>
              <p className="text-sm text-gray-600">Email: {BRAND.email}</p>
              <p className="text-sm text-gray-600">Phone: {BRAND.phone}</p>
              {BRAND.gstin && <p className="text-sm text-gray-600">GSTIN: {BRAND.gstin}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
              <p className="text-sm text-gray-600">Invoice No: {order.invoiceNo || order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <p className="text-sm text-gray-600">Order ID: {order.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-3">Bill To:</h3>
            <div className="text-gray-700">
              <p className="font-semibold">{order.customerName}</p>
              <p>{order.email}</p>
              {order.phone && <p>{order.phone}</p>}
              <p>{order.address}</p>
              <p>{order.city}, {order.state} - {order.zipCode}</p>
            </div>
          </div>

          <div className="mb-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4">Item</th>
                  <th className="text-right py-3 px-4">Size</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">Qty</th>
                  <th className="text-right py-3 px-4">GST %</th>
                  <th className="text-right py-3 px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const itemPrice = parseFloat(item.price.toString());
                  const itemGst = parseFloat(item.gstRate.toString());
                  const itemTotal = itemPrice * item.quantity;
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="font-medium">{item.variant.product.title}</div>
                        <div className="text-sm text-gray-600">SKU: {item.variant.sku}</div>
                      </td>
                      <td className="text-right py-3 px-4">{item.variant.size}</td>
                      <td className="text-right py-3 px-4">₹{itemPrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">{item.quantity}</td>
                      <td className="text-right py-3 px-4">{itemGst.toFixed(2)}%</td>
                      <td className="text-right py-3 px-4 font-semibold">₹{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">GST:</span>
                <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-semibold">{shippingFee === 0 ? 'Free' : `₹${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-800">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold text-indigo-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mb-8 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Payment Status:</span>{' '}
              <span className={`font-semibold ${order.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                {order.status.toUpperCase()}
              </span>
            </p>
            {order.paymentId && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Payment ID:</span> {order.paymentId}
              </p>
            )}
          </div>

          <div className="border-t pt-6 text-center text-sm text-gray-600">
            <p className="mb-2">Thank you for your business!</p>
            <p>For any queries, please contact us at {BRAND.email} or {BRAND.phone}</p>
          </div>

          <div className="flex gap-4 justify-center mt-6 no-print">
            <Link href={`/orders/${order.id}`}>
              <button className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold text-sm">
                Back to Order
              </button>
            </Link>
            <Link href="/product">
              <button className="bg-[#006A38] text-white px-6 py-3 rounded-lg hover:bg-emerald-800 font-semibold text-sm">
                Continue Shopping
              </button>
            </Link>
          </div>

          <PrintButton />
        </div>
      </div>
    </>
  );
}