import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { BRAND } from "@/lib/brand";
import { adminRateLimit } from "@/lib/adminGuard";
import { computeGstReport, istMonthRange } from "@/lib/gstReport";

// State code extracted from GSTIN (first 2 digits) — used for intra/inter-state split
function getGstinState(gstin: string): string {
  return gstin.slice(0, 2);
}

const HOME_STATE_CODE = getGstinState(BRAND.gstin);

// Shipping is never taxed at checkout (Order.total = subtotal + taxTotal +
// shippingFee, with no tax computed on shippingFee — confirmed in
// apps/web/app/actions/orders.ts) and no shipping-tax-rate field exists
// anywhere in the schema. Rather than inventing a rate, shipping is excluded
// from the GST slab/tax breakdown and disclosed explicitly here instead.
const SHIPPING_GST_DISCLOSURE =
  "Shipping fees are included in Gross Collection but excluded from the taxable/tax breakdown above — " +
  "this system does not currently record a shipping tax rate or amount at checkout. If shipping charges " +
  "are taxable under your GST registration, verify this amount manually before filing.";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["owner", "admin", "manager"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit((session.user as any).id ?? (session.user as any).email ?? "unknown");
  if (rl) return rl;

  const { searchParams } = new URL(request.url);
  const month  = parseInt(searchParams.get("month") ?? "0");
  const year   = parseInt(searchParams.get("year")  ?? "0");
  const format = searchParams.get("format");

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  const { from, to } = istMonthRange(year, month);

  // Fetch all orders in the period whose payment status could make them GST
  // candidates — final eligibility (incl. cancelled-order exclusion) is
  // applied inside computeGstReport so the same logic is unit-tested and
  // used here, not duplicated.
  const orders = await prisma.order.findMany({
    where: {
      status: "paid",
      createdAt: { gte: from, lt: to },
    },
    select: {
      id: true,
      state: true,
      subtotal: true,
      shippingFee: true,
      total: true,
      discountAmount: true,
      status: true,
      fulfillmentStatus: true,
      items: {
        select: {
          variantId: true,
          quantity: true,
          price: true,
          gstRate: true,
        },
      },
    },
  });

  const orderIds = orders.map((o) => o.id);

  // Refund credit adjustments: only returns actually recorded as refunded,
  // and only credited in the period the refund itself occurred — never
  // retroactively into the original sale's month.
  const refundedReturns = orderIds.length
    ? await prisma.return.findMany({
        where: {
          orderId: { in: orderIds },
          status: "refunded",
          createdAt: { gte: from, lt: to },
        },
        select: {
          orderId: true,
          items: { select: { variantId: true, quantity: true } },
        },
      })
    : [];

  const report = computeGstReport({
    orders: orders.map((o) => ({
      id: o.id,
      state: o.state,
      subtotal: toNum(o.subtotal),
      discountAmount: o.discountAmount ? toNum(o.discountAmount) : null,
      shippingFee: toNum(o.shippingFee),
      total: toNum(o.total),
      status: o.status,
      fulfillmentStatus: o.fulfillmentStatus,
      items: o.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: toNum(i.price),
        gstRate: toNum(i.gstRate),
      })),
    })),
    refunds: refundedReturns.map((r) => ({
      orderId: r.orderId,
      items: r.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    })),
    homeStateCode: HOME_STATE_CODE,
  });

  const fullReport = {
    month,
    year,
    gstin: BRAND.gstin,
    shippingGstDisclosure: SHIPPING_GST_DISCLOSURE,
    ...report,
  };

  // CSV download
  if (format === "csv") {
    const MONTHS = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    const lines: string[] = [
      `GST Report - ${MONTHS[month - 1]} ${year}`,
      `GSTIN,${BRAND.gstin}`,
      `Generated,${new Date().toISOString()}`,
      `Total Orders,${report.orderCount}`,
      "",
      "GST Rate,Taxable Value (₹),CGST (₹),SGST (₹),IGST (₹),Total Tax (₹),Order Count",
      ...report.slabs.map(s =>
        `${s.rate}%,${s.taxableValue.toFixed(2)},${s.cgst.toFixed(2)},${s.sgst.toFixed(2)},${s.igst.toFixed(2)},${s.totalTax.toFixed(2)},${s.orderCount}`
      ),
      `TOTAL,${report.grandTaxable.toFixed(2)},${report.grandCgst.toFixed(2)},${report.grandSgst.toFixed(2)},${report.grandIgst.toFixed(2)},${report.grandTax.toFixed(2)},${report.orderCount}`,
      "",
      "Revenue Reconciliation",
      `Taxable Sales,${report.grandTaxable.toFixed(2)}`,
      `Total GST,${report.grandTax.toFixed(2)}`,
      `Shipping Fees,${report.shippingFee.toFixed(2)}`,
      `Discounts Given,${report.discount.toFixed(2)}`,
      `Gross Collection,${report.grandTotal.toFixed(2)}`,
      "",
      `Note,"${SHIPPING_GST_DISCLOSURE.replace(/"/g, '""')}"`,
    ];

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="GST_Report_${MONTHS[month-1]}_${year}.csv"`,
      },
    });
  }

  return NextResponse.json(fullReport);
}
