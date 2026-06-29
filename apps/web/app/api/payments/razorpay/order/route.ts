import { prisma } from "../../../../../lib/db";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { toNum } from "../../../../../lib/decimal";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dbOrderId } = body;

    if (!dbOrderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Always read the authoritative total from the DB — never trust client-supplied amount
    const dbOrder = await prisma.order.findUnique({ where: { id: dbOrderId } });
    if (!dbOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (dbOrder.status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
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