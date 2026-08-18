// Pure, testable GST report calculation logic. apps/web/app/api/admin/gst-report/route.ts
// owns auth, the Prisma fetch, and CSV serialization; this module owns the math,
// so the formulas can be unit-tested without mocking Prisma or Next.js routing.
//
// Phase: Finance Analytics correction (2026-08-18). See
// docs/finance-reports-implementation-plan-2026-08-18.md for the full design
// rationale and the locked policy decisions this implements.

// ── Official CBIC GST state/UT codes ──────────────────────────────────────────
// Static, public reference data (not an accounting-policy assumption) — used
// to classify an order's billing/shipping state against HOME_STATE_CODE for
// CGST+SGST vs IGST. An unrecognized state name falls back to inter-state
// (IGST) with a console warning, rather than guessing intra-state.
export const STATE_NAME_TO_GST_CODE: Record<string, string> = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  "punjab": "03",
  "chandigarh": "04",
  "uttarakhand": "05",
  "haryana": "06",
  "delhi": "07",
  "rajasthan": "08",
  "uttar pradesh": "09",
  "bihar": "10",
  "sikkim": "11",
  "arunachal pradesh": "12",
  "nagaland": "13",
  "manipur": "14",
  "mizoram": "15",
  "tripura": "16",
  "meghalaya": "17",
  "assam": "18",
  "west bengal": "19",
  "jharkhand": "20",
  "odisha": "21",
  "chhattisgarh": "22",
  "madhya pradesh": "23",
  "gujarat": "24",
  "daman and diu": "25",
  "dadra and nagar haveli": "26",
  "maharashtra": "27",
  "andhra pradesh (old)": "28",
  "karnataka": "29",
  "goa": "30",
  "lakshadweep": "31",
  "kerala": "32",
  "tamil nadu": "33",
  "puducherry": "34",
  "andaman and nicobar islands": "35",
  "telangana": "36",
  "andhra pradesh": "37",
  "ladakh": "38",
};

// Normalizes a free-text state name (as stored in Order.state) for lookup.
function normalizeStateName(state: string): string {
  return state.trim().toLowerCase().replace(/[&]/g, "and").replace(/\s+/g, " ");
}

// Returns the GST state code for a given state name, or null if unrecognized.
export function lookupStateGstCode(state: string | null | undefined): string | null {
  if (!state) return null;
  return STATE_NAME_TO_GST_CODE[normalizeStateName(state)] ?? null;
}

// True if the order's billing state matches the business's home GST state
// (CGST+SGST applies); false for inter-state (IGST) — including the case
// where the state name isn't recognized, which is treated as inter-state
// (the safer default: flagged as IGST for manual review rather than silently
// assumed to be a home-state sale) and logged.
export function isIntraState(orderState: string | null | undefined, homeStateCode: string): boolean {
  const code = lookupStateGstCode(orderState);
  if (code === null) {
    if (orderState) {
      console.warn(`gstReport: unrecognized order.state "${orderState}" — treating as inter-state (IGST)`);
    }
    return false;
  }
  return code === homeStateCode;
}

// ── Order eligibility ─────────────────────────────────────────────────────────
// Locked policy: exclude cancelled orders via BOTH fields — a customer
// self-cancel writes both Order.status and Order.fulfillmentStatus to
// "cancelled"; an admin cancellation via the generic fulfillment buttons
// writes only fulfillmentStatus. Checking both closes that gap regardless of
// which path was used. status==='paid' already implies status!=='cancelled',
// but the explicit check is kept for defensive clarity per the locked scope.
export function isGstEligibleOrder(order: {
  status: string;
  fulfillmentStatus: string;
}): boolean {
  const isPaid = order.status === "paid";
  const isCancelled = order.status === "cancelled" || order.fulfillmentStatus === "cancelled";
  return isPaid && !isCancelled;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GstReportOrderInput {
  id: string;
  state: string | null;
  subtotal: number;
  discountAmount: number | null;
  shippingFee: number;
  total: number;
  status: string;
  fulfillmentStatus: string;
  items: { variantId: string; quantity: number; price: number; gstRate: number }[];
}

// A refunded return, already filtered by the caller to status === 'refunded'
// AND createdAt within the reporting period (refunds are credited in the
// period they occurred, never retroactively into the original sale's month —
// see the implementation plan §2 for why).
export interface GstReportRefundInput {
  orderId: string;
  items: { variantId: string; quantity: number }[];
}

export interface GstSlab {
  rate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  orderCount: number;
}

export interface GstReportResult {
  slabs: GstSlab[];
  grandTaxable: number;
  grandCgst: number;
  grandSgst: number;
  grandIgst: number;
  grandTax: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  orderCount: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ── Core calculation ────────────────────────────────────────────────────────────
//
// Formula (locked, see implementation plan §2):
//   lineValue    = item.price × item.quantity              — EXCLUSIVE, not inclusive
//   discountShare = order.discountAmount × (lineValue / order.subtotal)   — proportional
//   netTaxable   = lineValue − discountShare
//   taxLine      = netTaxable × (item.gstRate / 100)         — additive, matches calcLineGst
//   intra-state: cgst = sgst = taxLine / 2, igst = 0
//   inter-state: cgst = sgst = 0, igst = taxLine
//
// Refund credit adjustments: for each refunded return item, the SAME formula
// is applied to (matched order item's price × returned quantity) and
// SUBTRACTED from the relevant slab — using the same proportional discount
// share and the same intra/inter-state split as the original sale.
//
// All slab/grand accumulation stays full-precision; rounding happens once,
// at final serialization (round2), never per-line or per-accumulation.
export function computeGstReport({
  orders,
  refunds,
  homeStateCode,
}: {
  orders: GstReportOrderInput[];
  refunds: GstReportRefundInput[];
  homeStateCode: string;
}): GstReportResult {
  const eligibleOrders = orders.filter(isGstEligibleOrder);

  const slabMap: Record<
    number,
    { taxableValue: number; cgst: number; sgst: number; igst: number; totalTax: number; orderIds: Set<string> }
  > = {};

  let grandTaxable = 0;
  let grandCgst = 0;
  let grandSgst = 0;
  let grandIgst = 0;
  let grandTax = 0;
  let shippingFee = 0;
  let discount = 0;
  let grandTotal = 0;

  function ensureSlab(rate: number) {
    if (!slabMap[rate]) {
      slabMap[rate] = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, orderIds: new Set() };
    }
    return slabMap[rate];
  }

  // Apply a (possibly negative, for refund credits) taxable/tax contribution.
  function applyContribution(rate: number, orderId: string, netTaxable: number, intraState: boolean) {
    const taxLine = netTaxable * (rate / 100);
    const half = taxLine / 2;
    const cgst = intraState ? half : 0;
    const sgst = intraState ? half : 0;
    const igst = intraState ? 0 : taxLine;

    const slab = ensureSlab(rate);
    slab.taxableValue += netTaxable;
    slab.cgst += cgst;
    slab.sgst += sgst;
    slab.igst += igst;
    slab.totalTax += taxLine;
    slab.orderIds.add(orderId);

    grandTaxable += netTaxable;
    grandCgst += cgst;
    grandSgst += sgst;
    grandIgst += igst;
    grandTax += taxLine;
  }

  for (const order of eligibleOrders) {
    const intraState = isIntraState(order.state, homeStateCode);
    shippingFee += order.shippingFee;
    discount += order.discountAmount ?? 0;
    grandTotal += order.total;

    const discountAmount = order.discountAmount ?? 0;
    const subtotal = order.subtotal;

    for (const item of order.items) {
      const lineValue = item.price * item.quantity;
      const discountShare =
        discountAmount > 0 && subtotal > 0 ? discountAmount * (lineValue / subtotal) : 0;
      const netTaxable = lineValue - discountShare;
      applyContribution(item.gstRate, order.id, netTaxable, intraState);
    }
  }

  // Refund credit adjustments — only for orders that were included above
  // (an order excluded from GST, e.g. a cancelled one, cannot receive a
  // refund credit against a taxable value it never contributed).
  const eligibleOrderById = new Map(eligibleOrders.map((o) => [o.id, o]));

  for (const refund of refunds) {
    const order = eligibleOrderById.get(refund.orderId);
    if (!order) continue;

    const intraState = isIntraState(order.state, homeStateCode);
    const discountAmount = order.discountAmount ?? 0;
    const subtotal = order.subtotal;

    for (const returnItem of refund.items) {
      const orderItem = order.items.find((oi) => oi.variantId === returnItem.variantId);
      if (!orderItem) continue;

      const refundLineValue = orderItem.price * returnItem.quantity;
      const discountShare =
        discountAmount > 0 && subtotal > 0 ? discountAmount * (refundLineValue / subtotal) : 0;
      const refundNetTaxable = refundLineValue - discountShare;
      applyContribution(orderItem.gstRate, order.id, -refundNetTaxable, intraState);
    }
  }

  const slabs: GstSlab[] = Object.entries(slabMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([rate, data]) => ({
      rate: Number(rate),
      taxableValue: round2(data.taxableValue),
      cgst: round2(data.cgst),
      sgst: round2(data.sgst),
      igst: round2(data.igst),
      totalTax: round2(data.totalTax),
      orderCount: data.orderIds.size,
    }));

  return {
    slabs,
    grandTaxable: round2(grandTaxable),
    grandCgst: round2(grandCgst),
    grandSgst: round2(grandSgst),
    grandIgst: round2(grandIgst),
    grandTax: round2(grandTax),
    shippingFee: round2(shippingFee),
    discount: round2(discount),
    grandTotal: round2(grandTotal),
    orderCount: eligibleOrders.length,
  };
}

// ── IST date boundaries ─────────────────────────────────────────────────────────
// India's GST filing period is unambiguously IST-based (Asia/Kolkata, UTC+5:30,
// no DST). Building boundaries via new Date(year, month-1, 1) uses the SERVER
// PROCESS's local timezone, which on Vercel is typically UTC — misaligning the
// reported month by up to ~5.5 hours at the boundary. These helpers produce the
// correct UTC instant for IST midnight, regardless of server timezone.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function istMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);
}

export function istMonthRange(year: number, month: number): { from: Date; to: Date } {
  const from = istMonthStart(year, month);
  const to = month === 12 ? istMonthStart(year + 1, 1) : istMonthStart(year, month + 1);
  return { from, to };
}
