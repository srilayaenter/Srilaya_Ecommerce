import { prisma } from "../../lib/db";
import { toNum } from "../../lib/decimal";
import Link from "next/link";

export default async function AdminOverviewPage() {
  // 1. Parallel Database Query Aggregate Calls
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

  // 2. Compute metrics totals safely using type conversion helpers
  const totalRevenue = processingOrders.reduce((sum, order) => sum + toNum(order.total), 0);
  const pendingVerificationCount = pendingOrders.length;

  // Metric card parameters array matrix
  const metrics = [
    { title: "Gross Revenues", value: `₹${totalRevenue.toFixed(2)}`, description: "From verified processed orders", icon: "💰", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { title: "Awaiting Approval", value: pendingVerificationCount.toString(), description: "Pending UTR / Razorpay verifications", icon: "⏳", color: "text-amber-600 bg-amber-50 border-amber-100" },
    { title: "Total Orders placed", value: totalOrdersCount.toString(), description: "Lifetime transaction log capacity", icon: "📦", color: "text-blue-600 bg-blue-50 border-blue-100" },
    { title: "Low Stock Alerts", value: lowStockVariants.toString(), description: "Millet variants with <= 10 items left", icon: "⚠️", color: "text-rose-600 bg-rose-50 border-rose-100" },
  ];

  return (
    <div className="space-y-8 text-slate-800">
      
      {/* Upper Descriptive Welcome Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview Dashboard</h1>
        <p className="text-slate-400 text-xs mt-1 font-medium">
          Real-time snapshot monitoring system for sales trends, inventory health, and manual payment check logs.
        </p>
      </div>

      {/* 4-Column Aggregates KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((card) => (
          <div key={card.title} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{card.title}</span>
              <span className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm shadow-sm ${card.color}`}>
                {card.icon}
              </span>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-slate-900 tracking-tight block">{card.value}</span>
              <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-normal">{card.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Core Work Split Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT TWO-COLUMNS: RECENT TRANSACTIONS QUEUE TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs font-bold text-brand-green hover:underline bg-emerald-50 px-2.5 py-1 rounded-xl transition-all">
              Manage All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center font-medium">No order data rows found in the database yet.</p>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 font-bold">Order ID</th>
                    <th className="pb-3 font-bold">Customer</th>
                    <th className="pb-3 font-bold">Total Payable</th>
                    <th className="pb-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-3.5">{order.customerName || "Guest User"}</td>
                      <td className="py-3.5 font-bold text-slate-900">₹{toNum(order.total).toFixed(2)}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide inline-block ${
                          order.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          order.status === 'processing' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT ONE-COLUMN: QUICK COMPACT UTILITY LINK ACTIONS MODAL */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">Quick Shortcuts</h3>
          
          <div className="space-y-2.5">
            <Link href="/admin/orders?filter=pending" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-brand-green/30 transition-all group">
              <span className="text-lg">🔍</span>
              <div className="text-left">
                <span className="block font-bold text-xs text-slate-800 group-hover:text-brand-green transition-colors">Verify Pending Orders</span>
                <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">Process manual UTR bank transfers</span>
              </div>
            </Link>

            <Link href="/admin/inventory" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-brand-green/30 transition-all group">
              <span className="text-lg">🌾</span>
              <div className="text-left">
                <span className="block font-bold text-xs text-slate-800 group-hover:text-brand-green transition-colors">Restock Inventory</span>
                <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">Update bags stock and weight metrics</span>
              </div>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}