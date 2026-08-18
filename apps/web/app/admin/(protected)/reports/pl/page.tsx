import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { computePlReport, istMonthRange } from "@/lib/plReport";

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ month?: string; year?: string }>;

function toNum(d: any): number {
  return parseFloat(d?.toString() ?? '0');
}

const COGS_DISCLOSURE =
  "Cost of Goods Sold uses each product's CURRENT cost price, not the cost price at the time of sale. " +
  "If a variant's cost price has changed since these orders were placed, this month's COGS and profit " +
  "figures do not reflect actual historical cost.";

const RETURN_VALUE_DISCLOSURE =
  "Returns / Refunds is calculated as the original sale price × quantity returned — this system does not " +
  "separately record the actual refunded cash amount, so this figure is a proxy, not a confirmed payout.";

const SHIPPING_DISCLOSURE =
  "Shipping income and shipping expense are not included above. This system does not record actual courier " +
  "costs paid, only the customer-facing shipping fee charged — so shipping cannot be reliably reflected in " +
  "gross margin without either overstating income or omitting a real cost.";

export default async function ProfitLossPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) notFound();

  const sp = await searchParams;
  const now = new Date();
  const year  = parseInt(sp.year  ?? String(now.getFullYear()));
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));

  const { from, to } = istMonthRange(year, month);

  // ── Revenue & COGS: orders that are BOTH fulfilled AND paid ───────────────
  // Locked policy: fulfillmentStatus === 'completed' AND status === 'paid'.
  // Fetches a slightly broader set (any order in the date range) and lets
  // computePlReport apply exact eligibility, so that logic is unit-tested
  // and used here rather than duplicated.
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lt: to },
    },
    select: {
      id: true,
      status: true,
      fulfillmentStatus: true,
      items: {
        select: {
          variantId: true,
          quantity: true,
          price: true,
          variant: { select: { costPrice: true, size: true, product: { select: { title: true } } } },
        },
      },
    },
  });

  // ── Raw material production logs in the same period ──────────────────────
  const productionLogs = await prisma.rawMaterialLog.findMany({
    where: {
      type:      'production',
      createdAt: { gte: from, lt: to },
    },
    include: {
      rawMaterial: { select: { name: true, unit: true, costPerUnit: true } },
    },
  });

  // ── Returns in the same period — only 'refunded' counts (locked policy) ──
  const orderIds = orders.map(o => o.id);
  const returns = orderIds.length
    ? await prisma.return.findMany({
        where: {
          orderId:   { in: orderIds },
          status:    'refunded',
          createdAt: { gte: from, lt: to },
        },
        include: {
          items: true,
          order: { include: { items: { select: { variantId: true, price: true } } } },
        },
      })
    : [];

  const report = computePlReport({
    orders: orders.map(o => ({
      id: o.id,
      status: o.status,
      fulfillmentStatus: o.fulfillmentStatus,
      items: o.items.map(i => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: toNum(i.price),
        costPrice: i.variant?.costPrice != null ? toNum(i.variant.costPrice) : null,
        productTitle: i.variant?.product?.title ?? 'Unknown Product',
      })),
    })),
    refunds: returns.map(r => ({
      orderId: r.orderId,
      status: r.status,
      items: r.items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      orderItems: r.order.items.map(oi => ({ variantId: oi.variantId, price: toNum(oi.price) })),
    })),
    rawMaterialLogs: productionLogs.map(log => ({
      materialName: log.rawMaterial.name,
      unit: log.rawMaterial.unit,
      qty: log.qty,
      costPerUnit: log.rawMaterial.costPerUnit != null ? toNum(log.rawMaterial.costPerUnit) : null,
    })),
  });

  const {
    revenue, cogs, missingCostLineCount: missingCost, byProduct: sortedProducts,
    rawMatCost, rawMatMissingCost, byRawMat: sortedRawMat,
    returnValue, totalReturns, grossProfit, netProfit, grossMargin, netMargin, totalOrders,
  } = report;

  // ── Month navigation ──────────────────────────────────────────────────────
  const prevMonth = month === 1  ? 12 : month - 1;
  const prevYear  = month === 1  ? year - 1 : year;
  const nextMonth = month === 12 ? 1  : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;
  const monthName = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

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
          <p className="text-sm text-[#8D6E63] mt-1">Visible only to Business Owner · Based on completed & paid orders</p>
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

      {/* Disclosures */}
      <div className="space-y-2">
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ <strong>Live cost price:</strong> {COGS_DISCLOSURE}
        </div>
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ <strong>Refund figure is a proxy:</strong> {RETURN_VALUE_DISCLOSURE}
        </div>
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ <strong>Shipping not included:</strong> {SHIPPING_DISCLOSURE}
        </div>
      </div>

      {/* Missing variant cost price warning */}
      {missingCost > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ <strong>{missingCost} order line(s)</strong> have no cost price set on the variant — COGS and profit are understated.
          Go to <Link href="/admin/products" className="underline font-bold">Inventory Matrix</Link> and fill in the Cost Price column for those variants.
        </div>
      )}

      {/* Missing raw material cost warning */}
      {rawMatMissingCost && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm">
          ⚠ Some <strong>raw materials consumed in production</strong> have no Cost per Unit set — production material cost is understated.
          Go to <Link href="/admin/raw-materials" className="underline font-bold">Raw Materials</Link> and set the Cost per Unit on each ingredient.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total Revenue"        value={fmt(revenue)}      sub={`${totalOrders} orders`}                    color="green" />
        <SummaryCard label="Variant COGS"         value={fmt(cogs)}         sub="Cost price × qty sold"                      color="slate" />
        <SummaryCard label="Production Mat. Cost" value={fmt(rawMatCost)}   sub={`${sortedRawMat.length} material(s) used`}  color="slate" />
        <SummaryCard label="Returns / Refunds"    value={fmt(returnValue)}  sub={`${totalReturns} return(s)`}                color="orange" />
        <SummaryCard label="Gross Profit"         value={fmt(grossProfit)}  sub={`Margin ${grossMargin.toFixed(1)}%`}        color={grossProfit >= 0 ? 'green' : 'red'} />
        <SummaryCard label="Net Profit"           value={fmt(netProfit)}    sub={`Net margin ${netMargin.toFixed(1)}%`}      color={isProfitable ? 'green' : 'red'} large />
        <SummaryCard label="Avg Order Value"      value={fmt(totalOrders > 0 ? revenue / totalOrders : 0)} sub="Revenue ÷ orders" color="slate" />
        <SummaryCard label="Total Cost"           value={fmt(cogs + rawMatCost + returnValue)} sub="COGS + production + returns" color="slate" />
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#006A38]">
          <h2 className="font-bold text-white">P&L Statement — {monthName}</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[#F5F5F5]">
            <PLRow label="Gross Revenue"             value={fmt(revenue)}          note="Completed & paid orders" />
            <PLRow label="Cost of Goods Sold"        value={`(${fmt(cogs)})`}      note="Variant cost price × qty sold" negative />
            <PLRow label="Gross Profit"              value={fmt(grossProfit)}      bold highlight={grossProfit >= 0 ? 'green' : 'red'} />
            <PLRow label="Production Material Cost"  value={`(${fmt(rawMatCost)})`} note={`${sortedRawMat.length} raw material(s) consumed in production`} negative />
            <PLRow label="Returns & Refunds"         value={`(${fmt(returnValue)})`} note={`${totalReturns} refunded return(s)`} negative />
            <PLRow label="Net Profit / (Loss)"       value={fmt(netProfit)}        bold large highlight={isProfitable ? 'green' : 'red'} />
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
          <p className="text-sm text-[#9E9E9E] px-6 py-8 text-center">No completed & paid orders in this period.</p>
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

      {/* Raw material consumption breakdown */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#212121]">Production Material Cost</h2>
            <p className="text-xs text-[#9E9E9E] mt-0.5">Raw materials consumed during production batches logged in this period</p>
          </div>
          <span className="text-xs text-[#9E9E9E]">{sortedRawMat.length} materials · {fmt(rawMatCost)}</span>
        </div>
        {sortedRawMat.length === 0 ? (
          <p className="text-sm text-[#9E9E9E] px-6 py-8 text-center">
            No production batches logged in this period.{' '}
            <Link href="/admin/production" className="underline text-[#006A38]">Log a production batch →</Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] text-[11px] uppercase font-bold text-[#9E9E9E] tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Raw Material</th>
                <th className="px-6 py-3 text-right">Qty Consumed</th>
                <th className="px-6 py-3 text-right">Cost / Unit</th>
                <th className="px-6 py-3 text-right">Total Cost</th>
                <th className="px-6 py-3 text-right">% of Prod. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {sortedRawMat.map((m, i) => {
                const pct = rawMatCost > 0 ? (m.cost / rawMatCost) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-[#FAFAFA]">
                    <td className="px-6 py-3 font-medium text-[#212121]">
                      {m.name}
                      {m.missingCost && <span className="ml-2 text-[10px] text-amber-600 font-bold">⚠ cost missing</span>}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-[#424242]">
                      {m.qtyConsumed.toFixed(3)} {m.unit}
                    </td>
                    <td className="px-6 py-3 text-right text-[#9E9E9E]">
                      {m.missingCost ? <span className="text-amber-500">—</span> : fmt(m.cost / m.qtyConsumed)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-[#212121]">
                      {m.cost > 0 ? fmt(m.cost) : <span className="text-amber-500">—</span>}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-[#F0F0F0] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#006A38] h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-[#424242] w-10 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-[#F5F5F5] font-bold">
                <td className="px-6 py-3 text-[#212121]">Total</td>
                <td className="px-6 py-3" />
                <td className="px-6 py-3" />
                <td className="px-6 py-3 text-right font-mono text-[#212121]">{fmt(rawMatCost)}</td>
                <td className="px-6 py-3 text-right text-xs font-mono text-[#9E9E9E]">100%</td>
              </tr>
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
