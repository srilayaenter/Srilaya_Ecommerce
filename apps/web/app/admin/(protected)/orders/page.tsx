// app/admin/(protected)/orders/page.tsx
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";
// 1. SERVER ACTION: UPDATE STATUS OF AN ORDER
async function updateOrderStatus(formData: FormData) {
  'use server';
  
  const orderId = formData.get('orderId') as string;
  const nextStatus = formData.get('status') as string;

  if (!orderId) return;

  // Update order state safely via Prisma
  await prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus }
  });

  // Revalidate the server cache path instantly to refresh the UI values on screen
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

// 2. RENDER COMPONENT: ORDER QUEUE TABLE INTERFACE
export default async function AdminOrdersPage() {
  // Pull all order logs sorted sequentially by newest placement first
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          variant: { include: { product: true } }
        }
      }
    }
  });

  return (
    <div className="space-y-8 text-slate-800">
      
      {/* Page Narrative Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Orders</h1>
        <p className="text-slate-400 text-xs mt-1 font-medium">
          Verify UTR codes, approve manual transfers, and update dispatch fulfillment status tracking keys.
        </p>
      </div>

      {/* Main Order Logging Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-20 p-6">
            <span className="text-3xl">📦</span>
            <p className="text-slate-500 font-bold mt-3 text-sm">No orders recorded</p>
            <p className="text-slate-400 text-xs mt-1">As customers submit checkouts, their rows will populate right here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6 font-bold">Order Particulars</th>
                  <th className="p-4 font-bold">Customer Details</th>
                  <th className="p-4 font-bold">Items Purchased</th>
                  <th className="p-4 font-bold">Total Amount</th>
                  <th className="p-4 font-bold">Status Label</th>
                  <th className="p-4 pr-6 text-right font-bold">Actions Hub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((order) => {
                  const total = toNum(order.total);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/30 transition-colors group">
                      
                      {/* Column 1: Core ID Metadata */}
                      <td className="p-4 pl-6 vertical-align-top space-y-1">
                        <span className="font-mono font-black text-slate-900 text-sm block">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </td>

                      {/* Column 2: Customer / Address Information */}
                      <td className="p-4 space-y-1">
                        <span className="font-bold text-slate-800 block">{order.customerName || "Guest User"}</span>
                        <span className="text-slate-400 block text-[11px] leading-normal max-w-xs truncate">
                          {order.phone} • {order.city}, {order.state}
                        </span>
                      </td>

                      {/* Column 3: Summary Item Blocks */}
                      <td className="p-4 max-w-xs">
                        <div className="space-y-1 text-slate-600 font-medium text-[11px]">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="truncate">
                              • {item.variant.product.title} <span className="text-slate-400 font-bold">({item.variant.size} x {item.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Column 4: Pricing Matrix */}
                      <td className="p-4 font-extrabold text-slate-900 text-sm">
                        ₹{total.toFixed(2)}
                      </td>

                      {/* Column 5: Status Badge Callouts */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide border inline-block ${
                          order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          order.status === 'processing' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          order.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Column 6: Action Control Actuators */}
                      <td className="p-4 pr-6 text-right">
                        <form action={updateOrderStatus} className="inline-flex items-center gap-2">
                          <input type="hidden" name="orderId" value={order.id} />
                          
                          <select 
                            name="status" 
                            defaultValue={order.status}
                            className="bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand-green cursor-pointer"
                          >
                            <option value="pending">Pending Auth</option>
                            <option value="processing">Processing (Approve)</option>
                            <option value="completed">Completed (Dispatched)</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          <button 
                            type="submit"
                            className="bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all tracking-wide uppercase shadow-sm flex-shrink-0"
                          >
                            Update
                          </button>
                        </form>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}