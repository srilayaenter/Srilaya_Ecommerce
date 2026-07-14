import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ month?: string; year?: string }>;

function toNum(d: any): number {
  return parseFloat(d?.toString() ?? '0');
}

export default async function ProfitLossPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) notFound();

  const sp = await searchParams;
  const now = new Date();
  const year  = parseInt(sp.year  ?? String(now.getFullYear()));
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 1);   // exclusive upper bound

  // ── Revenue & COGS from delivered/completed orders ────────────────────────
  const orders = await prisma.order.findMany({
    where: {
      status:    { in: ['delivered', 'completed'] },
      createdAt: { gte: from, lt: to },
    },
    include: {
      items: {
        include: {
          variant: { select: { costPrice: true, size: true, product: { select: { title: true } } } },
        },
      },
    },
  });

  // ── Returns in the same period ────────────────────────────────────────────
  const returns = await prisma.return.findMany({
    where: {
      status:    { in: ['approved', 'completed'] },
      createdAt: { gte: from, lt: to },
    },
    include: {
      items: true,
      order: { include: { items: { select: { variantId: true, price: true, quantity: true } } } },
    },
  });

  // ── Aggregate ─────────────────────────────────────────────────────────────
  let revenue     = 0;
  let cogs        = 0;
  let missingCost = 0;

  // per-product breakdown
  const byProduct: Record<string, { title: string; revenue: number; cogs: number; qty: number; missingCost: boolean }> = {};

  for (const order of orders) {
    for (const item of order.items) {
      const lineRevenue = toNum(item.price) * item.quantity;
      const costPrice   = toNum(item.variant?.costPrice ?? null);
      const lineCogs    = costPrice > 0 ? costPrice * item.quantity : 0;
      const hasCost     = costPrice > 0;

      revenue += lineRevenue;
      cogs    += lineCogs;
      if (!hasCost) missingCost += 1;

      const title = item.variant?.product?.title ?? 'Unknown Product';
      const key   = title;
      if (!byProduct[key]) byProduct[key] = { title, revenue: 0, cogs: 0, qty: 0, missingCost: false };
      byProduct[key].revenue     += lineRevenue;
      byProduct[key].cogs        += lineCogs;
      byProduct[key].qty         += item.quantity;
      if (!hasCost) byProduct[key].missingCost = true;
    }
  }

  let returnValue = 0;
  for (const ret of returns) {
    for (const item of ret.items) {
      // Match the original price paid from the order items
      const orderItem = ret.order.items.find(oi => oi.variantId === item.variantId);
      const unitPrice = orderItem ? toNum(orderItem.price) : 0;
      returnValue += unitPrice * item.quantity;
    }
  }

  const grossProfit  = revenue - cogs;
  const netProfit    = grossProfit - returnValue;
  const grossMargin  = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin    = revenue > 0 ? (netProfit   / revenue) * 100 : 0;

  const totalOrders  = orders.length;
  const totalReturns = returns.length;

  // ── Month navigation ──────────────────────────────────────────────────────
  const prevMonth = month === 1  ? 12 : month - 1;
  const prevYear  = month === 1  ? year - 1 : year;
  const nextMonth = month === 12 ? 1  : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;
  const monthName = from.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const sortedProducts = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue);

  function fmt(n: number) {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const isProfitable = netProfit >= 0;

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Profit & Loss Report</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Visible only to Business Owner · Based on delivered & completed orders</p>
        </div>
        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/reports/pl?month=${prevMonth}&year=${prevYear}`}
            className="px-3 py-1.5 rounded-lg border border-[#E0E0E0] text-sm text-[#006A38] font-bold hover:bg-[#F5F5F5]"
          >
            ← Prev
          </Link>
          <span className="text-sm font-bold text-[#212121] min-w-[140px] text-center">{monthName}</span>
          <Link
            href={`/admin/reports/pl?month=${nextMonth}&year=${nextYear}`}
            className="px-3 py-1.5 rounded-lg border border-[#E0E0E0] text-sm text-[#006A38] font-bold hover:bg-[#F5F5F5]"
          >
            Next →
          </Link>
        </div>
      </div>

      {/* Missing cost price warning */}
      {missingCost > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ <strong>{missingCost} order line(s)</strong> have no cost price set on the variant — COGS and profit are understated.
          Go to <Link href="/admin/products" className="underline font-bold">Inventory Matrix</Link> and fill in the Cost Price column for those variants.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <SummaryCard label="Total Revenue"   value={fmt(revenue)}     sub={`${totalOrders} orders`}         color="green" />
        <SummaryCard label="Cost of Goods"   value={fmt(cogs)}        sub="Ingredient + material cost"      color="slate" />
        <SummaryCard label="Gross Profit"    value={fmt(grossProfit)} sub={`Margin ${grossMargin.toFixed(1)}%`} color={grossProfit >= 0 ? 'green' : 'red'} />
        <SummaryCard label="Returns / Refunds" value={fmt(returnValue)} sub={`${totalReturns} return(s)`}   color="orange" />
        <SummaryCard label="Net Profit"      value={fmt(netProfit)}   sub={`Net margin ${netMargin.toFixed(1)}%`} color={isProfitable ? 'green' : 'red'} large />
        <SummaryCard label="Avg Order Value" value={fmt(totalOrders > 0 ? revenue / totalOrders : 0)} sub="Revenue ÷ orders" color="slate" />
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#006A38]">
          <h2 className="font-bold text-white">P&L Statement — {monthName}</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[#F5F5F5]">
            <PLRow label="Gross Revenue"        value={fmt(revenue)}      note="All delivered/completed orders" />
            <PLRow label="Cost of Goods Sold"   value={`(${fmt(cogs)})`}  note="Sum of variant cost prices × qty sold" negative />
            <PLRow label="Gross Profit"         value={fmt(grossProfit)}  bold highlight={grossProfit >= 0 ? 'green' : 'red'} />
            <PLRow label="Returns & Refunds"    value={`(${fmt(returnValue)})`} note={`${totalReturns} approved return(s)`} negative />
            <PLRow label="Net Profit / (Loss)"  value={fmt(netProfit)}    bold large highlight={isProfitable ? 'green' : 'red'} />
          </tbody>
        </table>
      </div>

      {/* Product breakdown */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
          <h2 className="font-bold text-[#212121]">Revenue by Product</h2>
          <span className="text-xs text-[#9E9E9E]">Sorted by revenue · {sortedProducts.length} products</span>
        </div>
        {sortedProducts.length === 0 ? (
          <p className="text-sm text-[#9E9E9E] px-6 py-8 text-center">No delivered orders in this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] text-[11px] uppercase font-bold text-[#9E9E9E] tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-right">Qty Sold</th>
                <th className="px-6 py-3 text-right">Revenue</th>
                <th className="px-6 py-3 text-right">COGS</th>
                <th className="px-6 py-3 text-right">Gross Profit</th>
                <th className="px-6 py-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {sortedProducts.map((p, i) => {
                const gp     = p.revenue - p.cogs;
                const margin = p.revenue > 0 ? (gp / p.revenue) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-[#FFF8E1]/20">
                    <td className="px-6 py-3 font-medium text-[#212121]">
                      {p.title}
                      {p.missingCost && <span className="ml-2 text-[10px] text-amber-600 font-bold">⚠ cost missing</span>}
                    </td>
                    <td className="px-6 py-3 text-right text-[#424242]">{p.qty}</td>
                    <td className="px-6 py-3 text-right font-mono text-[#006A38] font-bold">{fmt(p.revenue)}</td>
                    <td className="px-6 py-3 text-right font-mono text-[#424242]">{p.cogs > 0 ? fmt(p.cogs) : <span className="text-amber-500">—</span>}</td>
                    <td className={`px-6 py-3 text-right font-mono font-bold ${gp >= 0 ? 'text-[#006A38]' : 'text-red-600'}`}>{fmt(gp)}</td>
                    <td className={`px-6 py-3 text-right text-xs font-bold ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                      {p.cogs > 0 ? `${margin.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-[#BDBDBD] text-right">
        Confidential · SriLaYa Foods · This report is only visible to the Business Owner account.
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color, large }: {
  label: string; value: string; sub?: string;
  color: 'green' | 'red' | 'slate' | 'orange'; large?: boolean;
}) {
  const colors = {
    green:  'bg-green-50 border-green-200 text-green-700',
    red:    'bg-red-50   border-red-200   text-red-700',
    slate:  'bg-white    border-[#E0E0E0] text-[#424242]',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${colors[color]} ${large ? 'lg:col-span-1' : ''}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className={`font-bold font-mono ${large ? 'text-2xl' : 'text-xl'}`}>{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

function PLRow({ label, value, note, negative, bold, large, highlight }: {
  label: string; value: string; note?: string;
  negative?: boolean; bold?: boolean; large?: boolean;
  highlight?: 'green' | 'red';
}) {
  const rowBg  = highlight === 'green' ? 'bg-green-50' : highlight === 'red' ? 'bg-red-50' : '';
  const valCol = highlight === 'green' ? 'text-green-700' : highlight === 'red' ? 'text-red-700' : negative ? 'text-red-600' : 'text-[#006A38]';
  return (
    <tr className={rowBg}>
      <td className={`px-6 py-3 ${bold ? 'font-bold' : 'font-medium'} text-[#212121] ${large ? 'text-base' : 'text-sm'}`}>
        {label}
        {note && <span className="ml-2 text-[11px] text-[#9E9E9E] font-normal">{note}</span>}
      </td>
      <td className={`px-6 py-3 text-right font-mono ${bold ? 'font-bold' : ''} ${large ? 'text-base' : 'text-sm'} ${valCol}`}>
        {value}
      </td>
    </tr>
  );
}
