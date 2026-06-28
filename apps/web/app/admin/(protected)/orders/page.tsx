import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";
import Link from "next/link";

// 1. SERVER ACTION: This runs securely on the server to update the database
async function updateFulfillmentStatus(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  const newStatus = formData.get("newStatus") as string;

  if (orderId && newStatus) {
    await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentStatus: newStatus },
    });
    
    // Instantly refresh the data on this page and the main dashboard
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; channel?: string; created?: string }>;
}) {
  const { filter, channel, created } = await searchParams;
  // 2. FILTER LOGIC: Catch the "?filter=pending" from your dashboard shortcut
  const currentFilter = filter || "all";
  const whereClause: any = {
    ...(currentFilter !== "all" ? { fulfillmentStatus: currentFilter } : {}),
    ...(channel === 'in_store' ? { orderChannel: 'in_store' } : {}),
  };

  // 3. DATA FETCHING: Grab orders based on the filter
  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { id: 'desc' }, // Show newest orders first
  });

  // Helper function to color-code status badges
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20';
      case 'processing': return 'bg-[#2196F3]/10 text-[#2196F3] border-[#2196F3]/20';
      case 'completed': return 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20';
      case 'cancelled': return 'bg-[#F44336]/10 text-[#F44336] border-[#F44336]/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {created && (
        <div className="bg-[#006A38]/10 border border-[#006A38]/30 text-[#006A38] px-4 py-3 rounded-lg text-sm font-semibold">
          In-store order created successfully — #{created.slice(0, 8).toUpperCase()}
        </div>
      )}

      {/* Page Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">Order Management</h1>
          <p className="text-[#8D6E63] text-[14px] mt-1 font-medium">
            Review UTR verifications and process customer shipments.
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="bg-[#006A38] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00522B] transition-colors whitespace-nowrap"
        >
          + New In-Store Order
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <div className="flex bg-white rounded-lg border border-[#E0E0E0] p-1 shadow-sm w-fit">
          <Link href="/admin/orders" className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentFilter === 'all' ? 'bg-[#FFF8E1] text-[#006A38]' : 'text-[#9E9E9E] hover:text-[#212121]'}`}>All</Link>
          <Link href="/admin/orders?filter=pending" className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentFilter === 'pending' ? 'bg-[#FFF8E1] text-[#006A38]' : 'text-[#9E9E9E] hover:text-[#212121]'}`}>Pending</Link>
          <Link href="/admin/orders?filter=processing" className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentFilter === 'processing' ? 'bg-[#FFF8E1] text-[#006A38]' : 'text-[#9E9E9E] hover:text-[#212121]'}`}>Processing</Link>
          <Link href="/admin/orders?filter=completed" className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${currentFilter === 'completed' ? 'bg-[#FFF8E1] text-[#006A38]' : 'text-[#9E9E9E] hover:text-[#212121]'}`}>Completed</Link>
        </div>
        <Link href="/admin/orders?channel=in_store" className={`px-4 py-1.5 text-sm font-semibold rounded-lg border transition-colors ${channel === 'in_store' ? 'bg-[#FF9800]/10 text-[#E65100] border-[#FF9800]/30' : 'bg-white border-[#E0E0E0] text-[#9E9E9E] hover:text-[#212121]'}`}>
          In-Store Only
        </Link>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
        {orders.length === 0 ? (
           <div className="py-16 text-center">
             <span className="text-4xl block mb-3">📭</span>
             <h3 className="text-lg font-bold text-[#212121]">No Orders Found</h3>
             <p className="text-[#8D6E63] text-sm mt-1">There are currently no orders matching this filter.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F5F5] text-[#9E9E9E] font-semibold uppercase text-[11px] tracking-wider border-b border-[#E0E0E0]">
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-[#424242]">
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-[#F5F5F5] hover:bg-[#FFF8E1]/20 transition-colors">
                    
                    <td className="py-4 px-6">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono font-semibold text-[#006A38] hover:underline">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className="block font-semibold text-[#212121]">{order.customerName || "Guest User"}</span>
                      <span className="block text-[11px] text-[#9E9E9E]">{order.email || "No email provided"}</span>
                      {order.orderChannel === 'in_store' && (
                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-[#FF9800]/10 text-[#E65100] px-1.5 py-0.5 rounded">In-Store</span>
                      )}
                    </td>
                    
                    {/* Note: Assumes your schema has a createdAt field */}
                    <td className="py-4 px-6 text-[#8D6E63]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    
                    <td className="py-4 px-6 font-bold text-[#006A38] text-right">
                      ₹{toNum(order.total).toFixed(2)}
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.fulfillmentStatus)}`}>
                          {order.fulfillmentStatus}
                        </span>
                        <span className={`text-[9px] font-semibold ${order.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                          Payment: {order.status}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="flex flex-col gap-1.5 items-end">
                        {/* Invoice link for in-store orders */}
                        {order.orderChannel === 'in_store' && (
                          <Link
                            href={`/admin/orders/${order.id}/invoice`}
                            className="bg-[#FFF8E1] border border-[#FF9800]/30 text-[#E65100] px-3 py-1.5 rounded-[6px] text-[11px] font-bold hover:bg-[#FF9800]/10 transition-colors"
                          >
                            🧾 Invoice
                          </Link>
                        )}

                        {order.fulfillmentStatus === 'pending' && (
                          <form action={updateFulfillmentStatus}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="newStatus" value="processing" />
                            <button
                              type="submit"
                              className="bg-[#006A38] hover:bg-[#00522B] text-white px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-colors shadow-sm"
                            >
                              Verify & Process
                            </button>
                          </form>
                        )}

                        {order.fulfillmentStatus === 'processing' && (
                          <form action={updateFulfillmentStatus}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="newStatus" value="completed" />
                            <button
                              type="submit"
                              className="bg-white border border-[#006A38] text-[#006A38] hover:bg-[#FFF8E1] px-3 py-1.5 rounded-[6px] text-[11px] font-bold transition-colors"
                            >
                              Mark Completed
                            </button>
                          </form>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}