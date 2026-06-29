import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const rawId    = (body.orderId as string ?? '').trim().replace(/^#/, '').toUpperCase();
  const contact  = (body.contact as string ?? '').trim().toLowerCase();

  if (!rawId || !contact) {
    return NextResponse.json({ error: "Order ID and email/phone are required." }, { status: 400 });
  }

  // Support short 8-char prefix OR full cuid
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: { startsWith: rawId.toLowerCase() } },
        { id: rawId.toLowerCase() },
      ],
    },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
      },
      shipment: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found. Please check your Order ID." }, { status: 404 });
  }

  // Verify the contact matches email or phone
  const emailMatch = order.email?.toLowerCase() === contact;
  const phoneMatch = order.phone?.replace(/\D/g, '').endsWith(contact.replace(/\D/g, ''));

  if (!emailMatch && !phoneMatch) {
    return NextResponse.json({ error: "Details don't match. Please check your email or phone." }, { status: 403 });
  }

  return NextResponse.json({
    id:               order.id,
    shortId:          order.id.slice(0, 8).toUpperCase(),
    customerName:     order.customerName,
    email:            order.email,
    phone:            order.phone,
    status:           order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    orderChannel:     order.orderChannel,
    paymentMethod:    order.paymentMethod,
    subtotal:         toNum(order.subtotal),
    taxTotal:         toNum(order.taxTotal),
    shippingFee:      toNum(order.shippingFee),
    total:            toNum(order.total),
    createdAt:        order.createdAt,
    address:          order.address,
    city:             order.city,
    state:            order.state,
    zipCode:          order.zipCode,
    items: order.items.map(i => ({
      title:    i.variant.product.title,
      size:     i.variant.size,
      quantity: i.quantity,
      price:    toNum(i.price),
      gstRate:  toNum(i.gstRate),
    })),
    shipment: order.shipment ? {
      courier:           order.shipment.courier,
      trackingNumber:    order.shipment.trackingNumber,
      trackingUrl:       order.shipment.trackingUrl,
      status:            order.shipment.status,
      estimatedDelivery: order.shipment.estimatedDelivery,
      shippedAt:         order.shipment.shippedAt,
    } : null,
  });
}
