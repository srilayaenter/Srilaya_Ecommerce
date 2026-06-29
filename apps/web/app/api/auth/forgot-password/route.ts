import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildPasswordResetEmail } from "@/lib/emails/passwordReset";
import crypto from "crypto";
import { parseBody, ForgotPasswordSchema } from "@/lib/validation";

// Rate limit: 3 requests per 15 min per IP to prevent email flooding
const resetAttempts = new Map<string, { count: number; resetAt: number }>();

function checkResetLimit(ip: string): boolean {
  const now = Date.now();
  const entry = resetAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    resetAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkResetLimit(ip)) {
      // Return success to avoid enumeration even when rate-limited
      return NextResponse.json({ success: true });
    }

    const parsed = await parseBody(request, ForgotPasswordSchema);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const { email } = parsed.data;

    const normalised = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalised } });

    // Always return success to avoid email enumeration
    if (!user) return NextResponse.json({ success: true });

    await prisma.passwordResetToken.deleteMany({ where: { email: normalised } });

    // Generate raw token (sent in email URL) and store only its SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token: tokenHash, email: normalised, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;

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
