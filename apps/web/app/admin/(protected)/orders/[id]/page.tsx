import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { toNum } from "@/lib/decimal";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import {
  buildDispatchEmail,
  buildDeliveredEmail,
} from "@/lib/emails/orderStatusUpdate";
import { Receipt, Phone, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { log } from "@/lib/logger";
import { applyPaymentStatusChange } from "@/lib/updatePaymentStatus";
import { applyFulfillmentStatusChange } from "@/lib/applyFulfillmentStatusChange";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function updateFulfillmentStatus(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  const newStatus = formData.get("newStatus") as string;
  if (!orderId || !newStatus) return;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    await log.flush();
    return;
  }

  const result = await applyFulfillmentStatusChange({
    orderId,
    newStatus,
    actorId: session.user.id,
    actorRole: session.user.role,
  });

  await log.flush();

  if (result.ok) {
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
  }
}

async function updatePaymentStatus(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  const newStatus = formData.get("newStatus") as string;
  if (!orderId || !newStatus) return;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    await log.flush();
    return;
  }

  const result = await applyPaymentStatusChange({
    orderId,
    newStatus,
    actorId: session.user.id,
    actorRole: session.user.role,
  });

  await log.flush();

  if (result.ok) {
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
  }
}

async function addShipment(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  const courier = formData.get("courier") as string;
  const trackingNumber = formData.get("trackingNumber") as string;
  const trackingUrl = (formData.get("trackingUrl") as string) || undefined;
  const estimatedDelivery = (formData.get("estimatedDelivery") as string)
    ? new Date(formData.get("estimatedDelivery") as string)
    : null;

  await prisma.shipment.upsert({
    where: { orderId },
    update: { courier, trackingNumber, trackingUrl, status: "booked" },
    create: {
      orderId,
      courier,
      trackingNumber,
      trackingUrl: trackingUrl ?? null,
      status: "booked",
    },
  });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { fulfillmentStatus: "processing" },
    select: { email: true, customerName: true, id: true },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");

  if (order.email) {
    const shortId = order.id.slice(0, 8).toUpperCase();
    sendEmail({
      to: order.email,
      subject: `Your SriLaYa order #${shortId} has been dispatched!`,
      html: buildDispatchEmail({
        customerName: order.customerName ?? "Valued Customer",
        shortId,
        courier,
        trackingNumber,
        trackingUrl: trackingUrl ?? null,
        estimatedDelivery,
      }),
      context: `dispatch-${orderId}`,
    }).catch(() => {});
  }
}

const FULFILLMENT_COLORS: Record<string, string> = {
  pending: "bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/30",
  processing: "bg-[#2196F3]/10 text-[#2196F3] border-[#2196F3]/30",
  completed: "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/30",
  cancelled: "bg-[#F44336]/10 text-[#F44336] border-[#F44336]/30",
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card (POS)",
  bank_transfer: "Bank Transfer",
  razorpay: "Razorpay",
  online: "Online",
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
      },
      shipment: true,
    },
  });

  if (!order) notFound();

  const subtotal = toNum(order.subtotal);
  const taxTotal = toNum(order.taxTotal);
  const shippingFee = toNum(order.shippingFee);
  const total = toNum(order.total);
  const isInStore = order.orderChannel === "in_store";

  const dateStr = order.createdAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = order.createdAt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 font-sans pb-12 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="text-sm text-[#006A38] font-bold hover:underline"
          >
            ← Orders
          </Link>
          <h1 className="text-2xl font-bold text-[#212121]">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          {isInStore && (
            <span className="text-xs bg-[#FF9800]/10 text-[#E65100] font-bold px-2 py-1 rounded-full">
              In-Store
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isInStore && (
            <Link
              href={`/admin/orders/${order.id}/invoice`}
              className="bg-[#FFF8E1] border border-[#FF9800]/30 text-[#E65100] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#FF9800]/10 transition-colors"
            >
              <Receipt
                size={14}
                weight="regular"
                className="inline-block mr-1.5"
              />
              Invoice / Send
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left col: items + totals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
              <h2 className="font-bold text-[#212121]">Items</h2>
              <span className="text-xs text-[#9E9E9E]">
                {order.items.length} line item
                {order.items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F9] text-[10px] uppercase font-bold text-[#9E9E9E]">
                <tr>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-center">Qty</th>
                  <th className="px-6 py-3 text-right">Rate</th>
                  <th className="px-6 py-3 text-right">GST</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {order.items.map((item) => {
                  const price = toNum(item.price);
                  const gstRate = toNum(item.gstRate);
                  const gstAmt = (price * item.quantity * gstRate) / 100;
                  const lineTotal = price * item.quantity * (1 + gstRate / 100);
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-[#212121]">
                          {item.variant.product.title}
                        </div>
                        <div className="text-xs text-[#8D6E63]">
                          {item.variant.size} · {item.variant.sku}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">{item.quantity}</td>
                      <td className="px-6 py-3 text-right">
                        ₹{price.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right text-[#616161]">
                        ₹{gstAmt.toFixed(2)}
                        <span className="block text-[10px] text-[#9E9E9E]">
                          {gstRate}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-[#212121]">
                        ₹{lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-[#F0F0F0] flex justify-end">
              <table className="text-sm w-64">
                <tbody>
                  <tr>
                    <td className="py-1 text-[#616161]">Subtotal</td>
                    <td className="py-1 text-right">₹{subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[#616161]">GST</td>
                    <td className="py-1 text-right">₹{taxTotal.toFixed(2)}</td>
                  </tr>
                  {!isInStore && (
                    <tr>
                      <td className="py-1 text-[#616161]">Shipping</td>
                      <td className="py-1 text-right">
                        {shippingFee === 0 ? (
                          <span className="text-[#006A38] font-semibold">
                            Free
                          </span>
                        ) : (
                          `₹${shippingFee.toFixed(2)}`
                        )}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-[#006A38]">
                    <td className="pt-2 font-black text-[#212121] text-base">
                      Total
                    </td>
                    <td className="pt-2 text-right font-black text-[#006A38] text-base">
                      ₹{total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Shipment — online orders only */}
          {!isInStore && (
            <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6">
              <h2 className="font-bold text-[#212121] mb-4">Shipment</h2>
              {order.shipment ? (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#9E9E9E] text-xs uppercase font-bold">
                        Courier
                      </span>
                      <p className="font-semibold mt-0.5">
                        {order.shipment.courier}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#9E9E9E] text-xs uppercase font-bold">
                        Tracking No.
                      </span>
                      <p className="font-semibold font-mono mt-0.5">
                        {order.shipment.trackingNumber}
                      </p>
                    </div>
                  </div>
                  {order.shipment.trackingUrl && (
                    <a
                      href={order.shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#006A38] font-bold text-sm hover:underline"
                    >
                      Track Shipment →
                    </a>
                  )}
                  <span
                    className={`inline-block text-xs font-bold px-2 py-1 rounded-full border ${FULFILLMENT_COLORS[order.shipment.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                  >
                    {order.shipment.status}
                  </span>
                </div>
              ) : (
                <form action={addShipment} className="space-y-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <p className="text-sm text-[#9E9E9E] mb-3">
                    No shipment added yet. Enter courier details to mark as
                    processing.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#616161] mb-1">
                        Courier Name *
                      </label>
                      <input
                        name="courier"
                        required
                        placeholder="e.g. DTDC, Bluedart"
                        className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#616161] mb-1">
                        Tracking Number *
                      </label>
                      <input
                        name="trackingNumber"
                        required
                        placeholder="AWB / tracking ID"
                        className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-[#616161] mb-1">
                        Tracking URL (optional)
                      </label>
                      <input
                        name="trackingUrl"
                        type="url"
                        placeholder="https://…"
                        className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-[#616161] mb-1">
                        Estimated Delivery (optional)
                      </label>
                      <input
                        name="estimatedDelivery"
                        type="date"
                        className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#006A38] text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#00522B] transition-colors"
                  >
                    Save Shipment & Email Customer
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right col: customer, payment, status */}
        <div className="space-y-4">
          {/* Order status */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
            <h2 className="font-bold text-[#212121] mb-3 text-sm">
              Order Status
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9E9E9E]">
                  Fulfillment
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${FULFILLMENT_COLORS[order.fulfillmentStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                  >
                    {order.fulfillmentStatus}
                  </span>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {["pending", "processing", "completed", "cancelled"]
                    .filter((s) => s !== order.fulfillmentStatus)
                    .map((s) => (
                      <form key={s} action={updateFulfillmentStatus}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="newStatus" value={s} />
                        <button
                          type="submit"
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#F5F5F5] hover:bg-[#E0E0E0] text-[#424242] transition-colors border border-[#E0E0E0] capitalize"
                        >
                          → {s}
                        </button>
                      </form>
                    ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9E9E9E]">
                  Payment
                </span>
                <div className="mt-1">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${order.status === "paid" ? "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/30" : "bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/30"}`}
                  >
                    {order.status}
                  </span>
                </div>
                {order.status !== "paid" && order.status !== "cancelled" && (
                  <form action={updatePaymentStatus} className="mt-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="newStatus" value="paid" />
                    <button
                      type="submit"
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#4CAF50]/10 hover:bg-[#4CAF50]/20 text-[#2E7D32] transition-colors border border-[#4CAF50]/30"
                    >
                      Mark as Paid
                    </button>
                  </form>
                )}
              </div>
              {order.paymentMethod && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9E9E9E]">
                    Method
                  </span>
                  <p className="text-sm font-semibold mt-0.5">
                    {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                  </p>
                </div>
              )}
              {order.paymentId && !order.paymentId.startsWith("COURIER:") && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9E9E9E]">
                    Payment Ref
                  </span>
                  <p className="text-xs font-mono mt-0.5 text-[#616161] break-all">
                    {order.paymentId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
            <h2 className="font-bold text-[#212121] mb-3 text-sm">Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-[#212121]">
                {order.customerName ?? "Guest"}
              </p>
              {order.phone && (
                <p className="text-[#616161] inline-flex items-center gap-1">
                  <Phone size={13} weight="regular" /> {order.phone}
                </p>
              )}
              {order.email && (
                <p className="text-[#616161] inline-flex items-center gap-1">
                  <EnvelopeSimple size={13} weight="regular" /> {order.email}
                </p>
              )}
            </div>
          </div>

          {/* Delivery address — online only */}
          {!isInStore && (order.address || order.city) && (
            <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
              <h2 className="font-bold text-[#212121] mb-3 text-sm">
                Delivery Address
              </h2>
              <div className="text-sm text-[#616161] space-y-0.5">
                {order.address && <p>{order.address}</p>}
                {(order.city || order.state) && (
                  <p>
                    {[order.city, order.state].filter(Boolean).join(", ")}
                    {order.zipCode ? ` – ${order.zipCode}` : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
            <h2 className="font-bold text-[#212121] mb-3 text-sm">Meta</h2>
            <div className="space-y-1.5 text-xs text-[#9E9E9E]">
              <p>
                <span className="font-bold">Created:</span> {dateStr}, {timeStr}
              </p>
              <p>
                <span className="font-bold">Channel:</span>{" "}
                {isInStore ? "In-Store" : "Online"}
              </p>
              {order.invoiceNo && !order.invoiceNo.startsWith("NOTE:") && (
                <p>
                  <span className="font-bold">Invoice No:</span>{" "}
                  {order.invoiceNo}
                </p>
              )}
              {order.invoiceNo?.startsWith("NOTE:") && (
                <p>
                  <span className="font-bold">Note:</span>{" "}
                  {order.invoiceNo.replace("NOTE:", "")}
                </p>
              )}
              <p className="font-mono text-[10px] break-all text-[#bbb] pt-1">
                {order.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
