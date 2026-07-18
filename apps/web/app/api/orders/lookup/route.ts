import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const RETURN_WINDOW_DAYS = 7;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId  = (searchParams.get("orderId") ?? "").trim().replace(/^#/, "").toLowerCase();
  const contact = (searchParams.get("contact") ?? "").trim().toLowerCase();

  if (!rawId || !contact) {
    return NextResponse.json({ error: "Order ID and contact are required." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: { startsWith: rawId } }, { id: rawId }] },
    include: {
      items: {
        include: { variant: { include: { product: { select: { title: true } } } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found. Check your order ID." }, { status: 404 });

  const emailMatch = order.email?.toLowerCase() === contact;
  const phoneMatch = order.phone?.replace(/\D/g, "").endsWith(contact.replace(/\D/g, ""));
  if (!emailMatch && !phoneMatch) {
    return NextResponse.json({ error: "Contact details don't match this order." }, { status: 403 });
  }

  if (order.fulfillmentStatus !== "completed") {
    return NextResponse.json({ error: "Returns can only be requested for delivered orders." }, { status: 400 });
  }

  const daysSince = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > RETURN_WINDOW_DAYS) {
    return NextResponse.json({ error: `The ${RETURN_WINDOW_DAYS}-day return window for this order has passed.` }, { status: 400 });
  }

  const items = order.items.map(i => ({
    variantId: i.variantId,
    title:     i.variant?.product?.title ?? "Product",
    size:      i.variant?.size ?? "",
    quantity:  i.quantity,
  }));

  return NextResponse.json({
    order: { id: order.id, items },
  });
}
