import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const [
    totalOrdersCount,
    pendingOrders,
    processingOrders,
    lowStockVariants,
    recentOrders
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({ where: { status: 'pending' } }),
    prisma.order.findMany({ where: { status: 'processing' } }),
    prisma.productVariant.count({ where: { stock: { lte: 10 } } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    })
  ]);

  // TypeScript explicitly knows sum is a number, and order is an object from Prisma
  const totalRevenue = processingOrders.reduce((sum: number, order: any) => sum + toNum(order.total), 0);
  const pendingVerificationCount = pendingOrders.length;

  // PRD Strict Semantic Colors Applied
  const metrics = [
    { title: "Gross Revenues", value: `₹${totalRevenue.toFixed(2)}`, description: "From verified processed orders", icon: "💰", color: "text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20" },
    { title: "Awaiting Approval", value: pendingVerificationCount.toString(), description: "Pending UTR verifications", icon: "⏳", color: "text-[#FF9800] bg-[#FF9800]/10 border-[#FF9800]/20" },
    { title: "Total Orders placed", value: totalOrdersCount.toString(), description: "Lifetime transaction count", icon: "📦", color: "text-[#2196F3] bg-[#2196F3]/10 border-[#2196F3]/20" },
    { title: "Low Stock Alerts", value: lowStockVariants.toString(), description: "Variants with <= 10 items left", icon: "⚠️", color: "text-[#F44336] bg-[#F44336]/10 border-[#F44336]/20" },
  ];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">Overview Dashboard</h1>
        <p className="text-[#8D6E63] text-[14px] mt-1 font-medium">
          Real-time snapshot monitoring system for sales trends and inventory health.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((card) => (
          <div key={card.title} className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider">{card.title}</span>
              <span className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg shadow-sm ${card.color}`}>
                {card.icon}
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[28px] font-bold text-[#212121] tracking-tight block">{card.value}</span>
              <span className="text-[11px] text-[#9E9E9E] font-medium block mt-1">{card.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F5F5F5] mb-4">
            <h3 className="text-[16px] font-semibold text-[#212121] font-poppins">Recent Orders</h3>
            <Link href="/admin/orders" className="text-[12px] font-bold text-[#4CAF50] hover:text-[#388E3C] hover:underline transition-colors">
              Manage All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center bg-[#FFF8E1]/50 rounded-[8px] border border-[#FFF8E1]">
              <span className="text-3xl block mb-2">🛒</span>
              <p className="text-[#8D6E63] font-medium text-[14px]">No order data found yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[#9E9E9E] font-semibold uppercase text-[11px] tracking-wider border-b border-[#E0E0E0]">
                    <th className="pb-3 px-2">Order ID</th>
                    <th className="pb-3 px-2">Customer</th>
                    <th className="pb-3 px-2 text-right">Total Payable</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[#424242]">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-[#F5F5F5] hover:bg-[#FFF8E1]/30 transition-colors">
                      <td className="py-3.5 px-2 font-mono font-semibold text-[#212121]">
                        #{order.id ? order.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}
                      </td>
                      <td className="py-3.5 px-2">{order.customerName || "Guest User"}</td>
                      <td className="py-3.5 px-2 font-bold text-[#4CAF50] text-right">₹{toNum(order.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Sidebar */}
        <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 h-fit">
          <h3 className="text-[16px] font-semibold text-[#212121] font-poppins pb-4 border-b border-[#F5F5F5] mb-4">Quick Shortcuts</h3>
          
          <div className="space-y-3">
            <Link href="/admin/orders?filter=pending" className="flex items-center gap-4 p-4 rounded-[8px] border border-[#E0E0E0] bg-white hover:bg-[#FFF8E1] hover:border-[#8D6E63]/30 transition-all group">
              <span className="text-2xl">🔍</span>
              <div>
                <span className="block font-bold text-[13px] text-[#212121] group-hover:text-[#8D6E63] transition-colors">Verify Pending Orders</span>
                <span className="block text-[11px] text-[#9E9E9E] mt-0.5">Process manual UTR bank transfers</span>
              </div>
            </Link>

            <Link href="/admin/products" className="flex items-center gap-4 p-4 rounded-[8px] border border-[#E0E0E0] bg-white hover:bg-[#FFF8E1] hover:border-[#8D6E63]/30 transition-all group">
              <span className="text-2xl">🌾</span>
              <div>
                <span className="block font-bold text-[13px] text-[#212121] group-hover:text-[#8D6E63] transition-colors">Restock Inventory</span>
                <span className="block text-[11px] text-[#9E9E9E] mt-0.5">Update product stock & price metrics</span>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}