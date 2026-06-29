import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager", "billing_staff"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status      = searchParams.get("status");
  const channel     = searchParams.get("channel");
  const from        = searchParams.get("from");
  const to          = searchParams.get("to");

  const where: any = {};
  if (status && status !== "all")   where.fulfillmentStatus = status;
  if (channel && channel !== "all") where.orderChannel = channel;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
      },
    },
  });

  const rows: string[] = [
    [
      "Order ID", "Invoice No", "Date", "Customer Name", "Email", "Phone",
      "Address", "City", "State", "ZIP",
      "Payment Method", "Payment Status", "Fulfillment Status", "Channel",
      "Items", "Subtotal (₹)", "GST (₹)", "Shipping (₹)", "Discount (₹)", "Total (₹)",
    ].join(","),
  ];

  for (const order of orders) {
    const itemsSummary = order.items
      .map(i => `${i.variant.product.title} (${i.variant.size}) x${i.quantity}`)
      .join(" | ")
      .replace(/,/g, ";");

    rows.push([
      order.id.slice(0, 8).toUpperCase(),
      order.invoiceNo ?? "",
      new Date(order.createdAt).toLocaleDateString("en-IN"),
      `"${(order.customerName ?? "").replace(/"/g, '""')}"`,
      order.email ?? "",
      order.phone ?? "",
      `"${(order.address ?? "").replace(/"/g, '""')}"`,
      order.city ?? "",
      order.state ?? "",
      order.zipCode ?? "",
      order.paymentMethod ?? "",
      order.status,
      order.fulfillmentStatus,
      order.orderChannel,
      `"${itemsSummary}"`,
      toNum(order.subtotal).toFixed(2),
      toNum(order.taxTotal).toFixed(2),
      toNum(order.shippingFee).toFixed(2),
      toNum(order.discountAmount ?? 0).toFixed(2),
      toNum(order.total).toFixed(2),
    ].join(","));
  }

  const csv = rows.join("\n");
  const filename = `Orders_Export_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
