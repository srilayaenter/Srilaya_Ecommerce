import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();

    const orders = await prisma.order.findMany({
      where: { email: normalised },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        shipment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const result = orders.map(o => ({
      id: o.id,
      shortId: o.id.slice(0, 8).toUpperCase(),
      status: o.status,
      fulfillmentStatus: o.fulfillmentStatus,
      orderChannel: o.orderChannel,
      paymentMethod: o.paymentMethod,
      total: parseFloat(o.total.toString()),
      createdAt: o.createdAt.toISOString(),
      itemCount: o.items.length,
      itemSummary: o.items.map(i => ({
        title: i.variant.product.title,
        size: i.variant.size,
        quantity: i.quantity,
      })),
      hasShipment: !!o.shipment,
      trackingNumber: o.shipment?.trackingNumber ?? null,
    }));

    return NextResponse.json({ orders: result });
  } catch (error: any) {
    console.error("Account orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
