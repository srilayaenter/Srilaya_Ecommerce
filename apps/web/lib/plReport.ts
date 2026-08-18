// Pure, testable P&L report calculation logic. apps/web/app/admin/(protected)/reports/pl/page.tsx
// owns auth and the Prisma fetch; this module owns the aggregation math, so it
// can be unit-tested without rendering a Server Component or mocking Prisma.
//
// Phase: Finance Analytics correction (2026-08-18). See
// docs/finance-reports-implementation-plan-2026-08-18.md for the full design
// rationale and the locked policy decisions this implements.

// ── Order eligibility ─────────────────────────────────────────────────────────
// Locked policy: revenue recognized only for orders that are BOTH fulfilled
// (fulfillmentStatus === 'completed') AND paid (status === 'paid'). This
// replaces the prior code's status IN ('delivered','completed') filter, which
// checked the wrong column (payment status) against fulfillment-status values
// — matching zero rows, always (confirmed in the investigation report).
export function isPlEligibleOrder(order: { status: string; fulfillmentStatus: string }): boolean {
  return order.fulfillmentStatus === "completed" && order.status === "paid";
}

// Locked policy: count a return only where status === 'refunded' — the real
// terminal "money left the business" state (requested -> approved -> received
// -> refunded, or rejected). 'approved'/'received' are not yet an actual
// refund; the prior code's status IN ('approved','completed') never matched
// the real lifecycle at all.
export function isPlEligibleRefund(ret: { status: string }): boolean {
  return ret.status === "refunded";
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PlOrderItemInput {
  variantId: string;
  quantity: number;
  price: number;
  costPrice: number | null; // ProductVariant.costPrice, read live — see COGS disclosure
  productTitle: string;
}

export interface PlOrderInput {
  id: string;
  status: string;
  fulfillmentStatus: string;
  items: PlOrderItemInput[];
}

// A return, already scoped to the reporting period by the caller's query.
// Eligibility (status === 'refunded') is re-checked here for testability/
// defense-in-depth, matching the pattern used in gstReport.ts.
export interface PlRefundInput {
  orderId: string;
  status: string;
  items: { variantId: string; quantity: number }[];
  // The order this return belongs to, needed to look up the original sale
  // price per variant (no refund amount is ever separately recorded — see
  // the proxy disclosure below).
  orderItems: { variantId: string; price: number }[];
}

export interface PlRawMaterialLogInput {
  materialName: string;
  unit: string;
  qty: number; // raw log value; production consumption is stored negative
  costPerUnit: number | null;
}

export interface PlProductBreakdown {
  title: string;
  revenue: number;
  cogs: number;
  qty: number;
  missingCost: boolean;
}

export interface PlRawMaterialBreakdown {
  name: string;
  unit: string;
  qtyConsumed: number;
  cost: number;
  missingCost: boolean;
}

export interface PlReportResult {
  revenue: number;
  cogs: number;
  missingCostLineCount: number;
  byProduct: PlProductBreakdown[];
  rawMatCost: number;
  rawMatMissingCost: boolean;
  byRawMat: PlRawMaterialBreakdown[];
  returnValue: number;
  totalReturns: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  totalOrders: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ── Core calculation ────────────────────────────────────────────────────────────
//
// revenue/cogs accumulate unrounded across every line; rounding happens once,
// at the end, on every returned aggregate figure — never per-line.
//
// COGS uses ProductVariant.costPrice read live at report-generation time —
// NOT a historical snapshot of cost at the time of sale. This is a known,
// disclosed limitation (see the UI disclosure text in reports/pl/page.tsx) —
// no historical cost data exists anywhere in the current schema to do better
// without a schema change, which is explicitly out of scope for this fix.
//
// returnValue uses the original order line's price × returned quantity as a
// PROXY for the refunded amount — no refund amount is ever separately
// recorded anywhere (confirmed: Return/ReturnItem have no amount field, and
// no payment-gateway refund event is logged). This must be disclosed as a
// proxy, not presented as a confirmed cash figure.
//
// Shipping income/expense and payment-gateway fees are deliberately NOT
// included anywhere in this calculation (locked policy: gross-margin-only
// scope for this fix; shipping expense has no reliable source data and must
// not be estimated).
export function computePlReport({
  orders,
  refunds,
  rawMaterialLogs,
}: {
  orders: PlOrderInput[];
  refunds: PlRefundInput[];
  rawMaterialLogs: PlRawMaterialLogInput[];
}): PlReportResult {
  const eligibleOrders = orders.filter(isPlEligibleOrder);

  let revenue = 0;
  let cogs = 0;
  let missingCostLineCount = 0;
  const byProductMap: Record<string, PlProductBreakdown> = {};

  for (const order of eligibleOrders) {
    for (const item of order.items) {
      const lineRevenue = item.price * item.quantity;
      const hasCost = item.costPrice !== null && item.costPrice > 0;
      const lineCogs = hasCost ? (item.costPrice as number) * item.quantity : 0;

      revenue += lineRevenue;
      cogs += lineCogs;
      if (!hasCost) missingCostLineCount += 1;

      const key = item.productTitle;
      if (!byProductMap[key]) {
        byProductMap[key] = { title: key, revenue: 0, cogs: 0, qty: 0, missingCost: false };
      }
      byProductMap[key].revenue += lineRevenue;
      byProductMap[key].cogs += lineCogs;
      byProductMap[key].qty += item.quantity;
      if (!hasCost) byProductMap[key].missingCost = true;
    }
  }

  let rawMatCost = 0;
  let rawMatMissingCost = false;
  const byRawMatMap: Record<string, PlRawMaterialBreakdown> = {};

  for (const log of rawMaterialLogs) {
    const consumed = Math.abs(log.qty);
    const costPerUnit = log.costPerUnit ?? 0;
    const hasCost = costPerUnit > 0;
    const lineCost = hasCost ? consumed * costPerUnit : 0;

    rawMatCost += lineCost;
    if (!hasCost) rawMatMissingCost = true;

    const key = log.materialName;
    if (!byRawMatMap[key]) {
      byRawMatMap[key] = { name: key, unit: log.unit, qtyConsumed: 0, cost: 0, missingCost: false };
    }
    byRawMatMap[key].qtyConsumed += consumed;
    byRawMatMap[key].cost += lineCost;
    if (!hasCost) byRawMatMap[key].missingCost = true;
  }

  const eligibleOrderById = new Map(eligibleOrders.map((o) => [o.id, o]));
  let returnValue = 0;
  let totalReturns = 0;

  for (const refund of refunds) {
    if (!isPlEligibleRefund(refund)) continue;
    // Only orders actually included in revenue above are eligible for a
    // return-value deduction — matches the GST report's same convention.
    if (!eligibleOrderById.has(refund.orderId)) continue;

    totalReturns += 1;
    for (const returnItem of refund.items) {
      const orderItem = refund.orderItems.find((oi) => oi.variantId === returnItem.variantId);
      const unitPrice = orderItem ? orderItem.price : 0;
      returnValue += unitPrice * returnItem.quantity;
    }
  }

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - returnValue - rawMatCost;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const byProduct = Object.values(byProductMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((p) => ({ ...p, revenue: round2(p.revenue), cogs: round2(p.cogs) }));

  const byRawMat = Object.values(byRawMatMap)
    .sort((a, b) => b.cost - a.cost)
    .map((m) => ({ ...m, cost: round2(m.cost) }));

  return {
    revenue: round2(revenue),
    cogs: round2(cogs),
    missingCostLineCount,
    byProduct,
    rawMatCost: round2(rawMatCost),
    rawMatMissingCost,
    byRawMat,
    returnValue: round2(returnValue),
    totalReturns,
    grossProfit: round2(grossProfit),
    netProfit: round2(netProfit),
    grossMargin: round2(grossMargin),
    netMargin: round2(netMargin),
    totalOrders: eligibleOrders.length,
  };
}

// IST date boundaries — reused from gstReport.ts (single source of truth for
// both finance reports) and re-exported here so callers only need to import
// from one place per report module.
export { istMonthStart, istMonthRange } from "@/lib/gstReport";
