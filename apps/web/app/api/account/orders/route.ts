import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const includeItems = {
  items: { include: { variant: { include: { product: true } } } },
  shipment: true,
} as const;

function serialise(orders: any[]) {
  return orders.map(o => ({
    id: o.id,
    shortId: o.id.slice(0, 8).toUpperCase(),
    status: o.status,
    fulfillmentStatus: o.fulfillmentStatus,
    orderChannel: o.orderChannel,
    paymentMethod: o.paymentMethod,
    total: parseFloat(o.total.toString()),
    createdAt: o.createdAt.toISOString(),
    itemCount: o.items.length,
    itemSummary: o.items.map((i: any) => ({
      title: i.variant.product.title,
      size:  i.variant.size,
      quantity: i.quantity,
    })),
    hasShipment: !!o.shipment,
    trackingNumber: o.shipment?.trackingNumber ?? null,
  }));
}

export async function POST(request: Request) {
  try {
    const { email, phone, userId } = await request.json();

    let where: Record<string, string>;
    if (userId)      where = { userId };
    else if (phone)  where = { phone: String(phone).replace(/\D/g, "").slice(-10) };
    else if (email)  where = { email: String(email).trim().toLowerCase() };
    else return NextResponse.json({ error: "Email, phone, or userId is required" }, { status: 400 });

    const orders = await prisma.order.findMany({
      where,
      include: includeItems,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders: serialise(orders) });
  } catch (error: any) {
    console.error("Account orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
