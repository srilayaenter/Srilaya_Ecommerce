import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import Link from "next/link";
import { CurrencyDollar, Package, Hourglass, Warning, Plant, ShoppingCart, MagnifyingGlass, Grains } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react/dist/ssr";

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions);
  const ownerView = isOwner(session?.user?.role ?? '');

  const [
    totalOrdersCount,
    pendingOrdersCount,
    paidOrders,
    lowStockVariants,
    recentOrders,
    lowRawMaterials,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.findMany({ where: { status: 'paid' }, select: { total: true } }),
    prisma.productVariant.findMany({ select: { stock: true, reorderThreshold: true } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    ownerView
      ? prisma.rawMaterial.findMany({
          select: { id: true, name: true, stockQty: true, reorderThreshold: true, unit: true },
          orderBy: { name: 'asc' },
        }).then(all => all.filter(m => m.stockQty <= m.reorderThreshold))
      : Promise.resolve([]),
  ]);

  const totalRevenue = paidOrders.reduce((sum: number, order: any) => sum + toNum(order.total), 0);
  const pendingVerificationCount = pendingOrdersCount;
  const lowStockCount = (lowStockVariants as any[]).filter(v => v.stock <= (v.reorderThreshold ?? 10)).length;
  const lowRawCount = lowRawMaterials.length;

  // PRD Strict Semantic Colors Applied
  const metrics: Array<{ title: string; value: string; description: string; icon: PhosphorIcon; color: string }> = [
    { title: "Gross Revenues",     value: `₹${totalRevenue.toFixed(2)}`, description: "From all confirmed paid orders",         icon: CurrencyDollar, color: "text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20" },
    { title: "Awaiting Approval",  value: pendingVerificationCount.toString(), description: "Pending UTR verifications",         icon: Hourglass,      color: "text-[#FF9800] bg-[#FF9800]/10 border-[#FF9800]/20" },
    { title: "Total Orders placed",value: totalOrdersCount.toString(),   description: "Lifetime transaction count",              icon: Package,        color: "text-[#2196F3] bg-[#2196F3]/10 border-[#2196F3]/20" },
    { title: "Low Stock Alerts",   value: lowStockCount.toString(),       description: "Variants at or below reorder threshold", icon: Warning,        color: "text-[#F44336] bg-[#F44336]/10 border-[#F44336]/20" },
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
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${ownerView ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {metrics.map((card) => (
          <div key={card.title} className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider">{card.title}</span>
              <span className={`w-9 h-9 rounded-lg border flex items-center justify-center shadow-sm ${card.color}`}>
                <card.icon size={18} weight="regular" />
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[28px] font-bold text-[#212121] tracking-tight block">{card.value}</span>
              <span className="text-[11px] text-[#9E9E9E] font-medium block mt-1">{card.description}</span>
            </div>
          </div>
        ))}

        {/* Owner-only: Raw material low stock card */}
        {ownerView && (
          <Link href="/admin/raw-materials" className="block">
            <div className={`rounded-[12px] border shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300 h-full ${
              lowRawCount > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-[#E0E0E0]'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider">Raw Material Alerts</span>
                <span className={`w-9 h-9 rounded-lg border flex items-center justify-center shadow-sm ${
                  lowRawCount > 0 ? 'text-red-600 bg-red-100 border-red-200' : 'text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20'
                }`}>
                  <Plant size={18} weight="regular" />
                </span>
              </div>
              <div className="mt-4">
                <span className={`text-[28px] font-bold tracking-tight block ${lowRawCount > 0 ? 'text-red-600' : 'text-[#212121]'}`}>
                  {lowRawCount}
                </span>
                <span className="text-[11px] text-[#9E9E9E] font-medium block mt-1">
                  {lowRawCount > 0 ? 'Raw materials need restock' : 'All raw materials OK'}
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Owner-only: Raw material low stock detail banner */}
      {ownerView && lowRawCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1.5">
                <Plant size={15} weight="regular" /> {lowRawCount} raw material{lowRawCount > 1 ? 's' : ''} at or below reorder threshold
              </p>
              <div className="flex flex-wrap gap-2">
                {lowRawMaterials.map(m => (
                  <Link key={m.id} href={`/admin/raw-materials/${m.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors">
                    {m.name}
                    <span className="font-mono font-bold">{m.stockQty.toFixed(2)}{m.unit}</span>
                    <span className="text-red-400">/ {m.reorderThreshold}{m.unit}</span>
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/admin/raw-materials"
              className="shrink-0 text-xs font-bold text-red-600 hover:text-red-800 underline whitespace-nowrap">
              Manage →
            </Link>
          </div>
        </div>
      )}

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
              <ShoppingCart size={32} weight="regular" className="mx-auto mb-2 text-[#9E9E9E]" />
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
              <MagnifyingGlass size={24} weight="regular" className="text-[#9E9E9E] shrink-0" />
              <div>
                <span className="block font-bold text-[13px] text-[#212121] group-hover:text-[#8D6E63] transition-colors">Verify Pending Orders</span>
                <span className="block text-[11px] text-[#9E9E9E] mt-0.5">Process manual UTR bank transfers</span>
              </div>
            </Link>

            <Link href="/admin/products" className="flex items-center gap-4 p-4 rounded-[8px] border border-[#E0E0E0] bg-white hover:bg-[#FFF8E1] hover:border-[#8D6E63]/30 transition-all group">
              <Grains size={24} weight="regular" className="text-[#9E9E9E] shrink-0" />
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