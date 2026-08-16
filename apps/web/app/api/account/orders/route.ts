import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getIp } from "@/lib/rateLimit";

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

// Guest order lookup by email only — the only lookup mode the product UX
// actually uses (see AccountClient.tsx's handleGuestLookup). Authenticated
// users' orders are fetched server-side from their own session in
// app/(shop)/account/page.tsx and never go through this route — there is no
// legitimate "userId" input here, so none is accepted. A "phone" lookup mode
// existed here previously but had no caller anywhere in the app; removed
// along with userId to shrink the unauthenticated lookup surface to exactly
// what the product uses.
export async function POST(request: Request) {
  try {
    // 10 lookups per hour per IP — same budget as other unauthenticated
    // contact-based lookups (reset-password, order cancel/lookup).
    if (!checkRateLimit(`account-orders:${getIp(request)}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { email: email.trim().toLowerCase() },
      include: includeItems,
      orderBy: { createdAt: "desc" },
    });

    // Empty array for "no such email" and "email with zero orders" alike —
    // never distinguishes the two, so this can't be used to enumerate
    // registered emails.
    return NextResponse.json({ orders: serialise(orders) });
  } catch (error: any) {
    console.error("Account orders error:", error.message);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
