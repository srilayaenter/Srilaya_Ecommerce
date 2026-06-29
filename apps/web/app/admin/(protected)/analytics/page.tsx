import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";

export default async function AnalyticsPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [paidOrders, topItemsRaw, orderStatusCounts] = await Promise.all([
    prisma.order.findMany({
      where: { status: "paid", createdAt: { gte: thirtyDaysAgo } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  // Build daily revenue for last 30 days
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const o of paidOrders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    if (key in dayMap) dayMap[key] += toNum(o.total);
  }
  const days = Object.entries(dayMap);
  const maxRevenue = Math.max(...days.map(([, v]) => v), 1);
  const totalRevenue = days.reduce((s, [, v]) => s + v, 0);

  // Top products
  const variantIds = topItemsRaw.map(r => r.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { title: true } } },
  });
  const topItems = topItemsRaw.map(r => ({
    qty: r._sum.quantity ?? 0,
    label: variants.find(v => v.id === r.variantId)?.product.title ?? "Unknown",
    size:  variants.find(v => v.id === r.variantId)?.size ?? "",
  }));
  const maxQty = Math.max(...topItems.map(i => i.qty), 1);

  // Status breakdown
  const statusMap = Object.fromEntries(orderStatusCounts.map(s => [s.status, s._count]));
  const totalOrders = orderStatusCounts.reduce((s, r) => s + r._count, 0);

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">Sales Analytics</h1>
        <p className="text-[#8D6E63] text-[14px] mt-1 font-medium">Revenue and order trends for the last 30 days.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (30d)", value: `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: "💰" },
          { label: "Paid Orders", value: (statusMap["paid"] ?? 0).toString(), icon: "✅" },
          { label: "COD Pending", value: (statusMap["cod_pending"] ?? 0).toString(), icon: "🛵" },
          { label: "Total Orders", value: totalOrders.toString(), icon: "📦" },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-sm">
            <p className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider">{m.label}</p>
            <p className="text-2xl font-black text-[#212121] mt-2">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#212121] mb-6">Daily Revenue — Last 30 Days</h2>
        <div className="flex items-end gap-[3px] h-40 w-full">
          {days.map(([date, value]) => {
            const height = maxRevenue > 0 ? (value / maxRevenue) * 100 : 0;
            const label = new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-[#006A38] rounded-t-sm transition-all group-hover:bg-[#00522B]"
                  style={{ height: `${Math.max(height, value > 0 ? 4 : 0)}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-[#212121] text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10">
                  {label}: ₹{value.toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[#9E9E9E]">
          <span>{new Date(days[0][0]).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
          <span>{new Date(days[days.length - 1][0]).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
        </div>
      </div>

      {/* Top products + Order status */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Top products */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#212121] mb-5">Top Selling Products (All Time)</h2>
          <div className="space-y-4">
            {topItems.length === 0 && <p className="text-sm text-[#9E9E9E]">No sales data yet.</p>}
            {topItems.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-[#212121] truncate">{item.label} <span className="text-[#9E9E9E] font-normal">({item.size})</span></span>
                  <span className="font-bold text-[#006A38] ml-2 flex-shrink-0">{item.qty} sold</span>
                </div>
                <div className="w-full bg-[#F5F5F5] rounded-full h-2">
                  <div
                    className="bg-[#006A38] h-2 rounded-full"
                    style={{ width: `${(item.qty / maxQty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#212121] mb-5">Order Status Breakdown</h2>
          <div className="space-y-3">
            {orderStatusCounts.map(s => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006A38]" />
                  <span className="capitalize text-[#424242] font-medium">{s.status.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-[#F5F5F5] rounded-full h-2">
                    <div className="bg-[#006A38] h-2 rounded-full" style={{ width: `${totalOrders > 0 ? (s._count / totalOrders) * 100 : 0}%` }} />
                  </div>
                  <span className="font-bold text-[#212121] w-8 text-right">{s._count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
