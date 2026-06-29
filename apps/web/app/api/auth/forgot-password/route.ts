import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildPasswordResetEmail } from "@/lib/emails/passwordReset";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const normalised = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalised } });

    // Always return success to avoid email enumeration
    if (!user) return NextResponse.json({ success: true });

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email: normalised } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, email: normalised, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

    await sendEmail({
      to: normalised,
      subject: "Reset your SriLaYa Admin password",
      html: buildPasswordResetEmail({ resetUrl }),
      context: `password_reset:${user.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
