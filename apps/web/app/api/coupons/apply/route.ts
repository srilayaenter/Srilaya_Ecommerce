import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { code, orderTotal } = await request.json();
    if (!code) return NextResponse.json({ error: "Coupon code required" }, { status: 400 });

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
    }

    const minOrder = coupon.minOrder ? parseFloat(coupon.minOrder.toString()) : 0;
    if (orderTotal < minOrder) {
      return NextResponse.json(
        { error: `Minimum order of ₹${minOrder.toFixed(0)} required for this coupon` },
        { status: 400 }
      );
    }

    const value = parseFloat(coupon.value.toString());
    const discount = coupon.type === "percentage"
      ? Math.min((orderTotal * value) / 100, orderTotal)
      : Math.min(value, orderTotal);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value,
      discount: parseFloat(discount.toFixed(2)),
      label: coupon.type === "percentage" ? `${value}% off` : `₹${value.toFixed(0)} off`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to apply coupon" }, { status: 500 });
  }
}
