import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { parseBody, ResetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, ResetPasswordSchema);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const { token, password } = parsed.data;

    // Hash the raw token from URL to look up the stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token: tokenHash } });
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
      prisma.passwordResetToken.delete({ where: { token: tokenHash } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
