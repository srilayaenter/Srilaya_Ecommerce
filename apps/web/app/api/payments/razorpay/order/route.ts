import { prisma } from "../../../../../lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { toNum } from "../../../../../lib/decimal";
import { authOptions } from "../../../../../lib/auth";
import { canPayOrder } from "../../../../../lib/payAuth";

// Generic, non-enumerating error for every authorization failure below —
// never distinguishes "order not found" from "order exists but you're not
// authorized" or "order isn't pending", same discipline as the pay page.
const GENERIC_ERROR = "Unable to start payment for this order.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dbOrderId, payToken } = body;

    if (!dbOrderId || typeof dbOrderId !== "string") {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Always read the authoritative total from the DB — never trust client-supplied amount
    const dbOrder = await prisma.order.findUnique({ where: { id: dbOrderId } });
    if (!dbOrder) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 404 });
    }

    // Require a pending order explicitly — reject paid, expired, cancelled,
    // failed, or any other non-pending state, not just "already paid".
    if (dbOrder.status !== "pending") {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    // Authorization boundary: never trust a client-supplied identity. A
    // logged-in caller must own the order via session; a guest caller must
    // present a valid pay capability token bound to this exact order ID.
    // No Razorpay call and no paymentId mutation happen below this point
    // unless this passes.
    const session = await getServerSession(authOptions);
    if (!canPayOrder(dbOrder, session, typeof payToken === "string" ? payToken : undefined)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 });
    }

    const amount = toNum(dbOrder.total);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { dbOrderId },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    await prisma.order.update({
      where: { id: dbOrderId },
      data: { paymentId: razorpayOrder.id },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      dbOrderId,
    });

  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}