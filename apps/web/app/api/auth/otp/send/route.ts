import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOtpSms } from "@/lib/sms";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
    }

    const normalised = phone.replace(/\s/g, "").slice(-10);

    // Rate-limit: max 3 OTPs per phone in 10 minutes (count before cleanup)
    const recentCount = await prisma.phoneOtp.count({
      where: {
        phone: normalised,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recentCount >= 3) {
      return NextResponse.json({ error: "Too many OTP requests. Please wait 10 minutes." }, { status: 429 });
    }

    // Delete only expired OTPs; keep recent ones so the count above stays accurate
    await prisma.phoneOtp.deleteMany({
      where: { phone: normalised, expiresAt: { lt: new Date() } },
    });

    const otp = generateOtp();
    await prisma.phoneOtp.create({
      data: {
        phone: normalised,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpSms(normalised, otp);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
