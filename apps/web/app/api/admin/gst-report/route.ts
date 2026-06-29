import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { BRAND } from "@/lib/brand";

// State code extracted from GSTIN (first 2 digits) — used for intra/inter-state split
function getGstinState(gstin: string): string {
  return gstin.slice(0, 2);
}

// Karnataka state code is "29"; orders from same state = CGST+SGST, else IGST
const HOME_STATE_CODE = getGstinState(BRAND.gstin);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month  = parseInt(searchParams.get("month") ?? "0");
  const year   = parseInt(searchParams.get("year")  ?? "0");
  const format = searchParams.get("format");

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  const from = new Date(year, month - 1, 1);           // first day of month
  const to   = new Date(year, month, 1);               // first day of next month

  // Fetch all paid/cod_paid orders in the period with their items
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["paid", "cod_paid"] },
      createdAt: { gte: from, lt: to },
    },
    select: {
      id: true,
      state: true,
      subtotal: true,
      taxTotal: true,
      shippingFee: true,
      total: true,
      discountAmount: true,
      items: {
        select: {
          quantity: true,
          price: true,
          gstRate: true,
        },
      },
    },
  });

  // Aggregate by GST rate slab
  const slabMap: Record<number, {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    orderIds: Set<string>;
  }> = {};

  let grandTaxable  = 0;
  let grandCgst     = 0;
  let grandSgst     = 0;
  let grandIgst     = 0;
  let grandTax      = 0;
  let shippingFee   = 0;
  let discount      = 0;
  let grandTotal    = 0;

  for (const order of orders) {
    const isIntraState = (order.state ?? "").trim().toLowerCase().startsWith("karnataka");
    shippingFee += toNum(order.shippingFee);
    discount    += toNum(order.discountAmount ?? 0);
    grandTotal  += toNum(order.total);

    for (const item of order.items) {
      const rate       = toNum(item.gstRate);            // e.g. 5, 12, 18
      const lineValue  = toNum(item.price) * item.quantity;
      // Back-calculate taxable value: lineValue already includes GST
      const taxable    = lineValue / (1 + rate / 100);
      const taxAmount  = lineValue - taxable;
      const halfTax    = taxAmount / 2;

      const cgst = isIntraState ? halfTax : 0;
      const sgst = isIntraState ? halfTax : 0;
      const igst = isIntraState ? 0 : taxAmount;

      if (!slabMap[rate]) {
        slabMap[rate] = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, orderIds: new Set() };
      }
      slabMap[rate].taxableValue += taxable;
      slabMap[rate].cgst         += cgst;
      slabMap[rate].sgst         += sgst;
      slabMap[rate].igst         += igst;
      slabMap[rate].totalTax     += taxAmount;
      slabMap[rate].orderIds.add(order.id);

      grandTaxable += taxable;
      grandCgst    += cgst;
      grandSgst    += sgst;
      grandIgst    += igst;
      grandTax     += taxAmount;
    }
  }

  const slabs = Object.entries(slabMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([rate, data]) => ({
      rate:         Number(rate),
      taxableValue: parseFloat(data.taxableValue.toFixed(2)),
      cgst:         parseFloat(data.cgst.toFixed(2)),
      sgst:         parseFloat(data.sgst.toFixed(2)),
      igst:         parseFloat(data.igst.toFixed(2)),
      totalTax:     parseFloat(data.totalTax.toFixed(2)),
      orderCount:   data.orderIds.size,
    }));

  const report = {
    month,
    year,
    gstin:        BRAND.gstin,
    slabs,
    grandTaxable: parseFloat(grandTaxable.toFixed(2)),
    grandCgst:    parseFloat(grandCgst.toFixed(2)),
    grandSgst:    parseFloat(grandSgst.toFixed(2)),
    grandIgst:    parseFloat(grandIgst.toFixed(2)),
    grandTax:     parseFloat(grandTax.toFixed(2)),
    shippingFee:  parseFloat(shippingFee.toFixed(2)),
    discount:     parseFloat(discount.toFixed(2)),
    grandTotal:   parseFloat(grandTotal.toFixed(2)),
    orderCount:   orders.length,
  };

  // CSV download
  if (format === "csv") {
    const MONTHS = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    const lines: string[] = [
      `GST Report - ${MONTHS[month - 1]} ${year}`,
      `GSTIN,${BRAND.gstin}`,
      `Generated,${new Date().toISOString()}`,
      `Total Orders,${orders.length}`,
      "",
      "GST Rate,Taxable Value (₹),CGST (₹),SGST (₹),IGST (₹),Total Tax (₹),Order Count",
      ...slabs.map(s =>
        `${s.rate}%,${s.taxableValue.toFixed(2)},${s.cgst.toFixed(2)},${s.sgst.toFixed(2)},${s.igst.toFixed(2)},${s.totalTax.toFixed(2)},${s.orderCount}`
      ),
      `TOTAL,${grandTaxable.toFixed(2)},${grandCgst.toFixed(2)},${grandSgst.toFixed(2)},${grandIgst.toFixed(2)},${grandTax.toFixed(2)},${orders.length}`,
      "",
      "Revenue Reconciliation",
      `Taxable Sales,${grandTaxable.toFixed(2)}`,
      `Total GST,${grandTax.toFixed(2)}`,
      `Shipping Fees,${shippingFee.toFixed(2)}`,
      `Discounts Given,${discount.toFixed(2)}`,
      `Gross Collection,${grandTotal.toFixed(2)}`,
    ];

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="GST_Report_${MONTHS[month-1]}_${year}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
