import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { headers } from "next/headers";

// Simple in-memory rate limiter: max 10 attempts per IP per 10-minute window
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

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

  // Exact match required for both email and phone — no partial/suffix matching
  const normalizedPhone = contact.replace(/\D/g, '');
  const orderPhone      = (order.phone ?? '').replace(/\D/g, '');
  const emailMatch = order.email?.toLowerCase() === contact;
  const phoneMatch = normalizedPhone.length >= 10 && orderPhone === normalizedPhone;

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
      title:     i.variant.product.title,
      size:      i.variant.size,
      quantity:  i.quantity,
      price:     toNum(i.price),
      gstRate:   toNum(i.gstRate),
      variantId: i.variantId,
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
