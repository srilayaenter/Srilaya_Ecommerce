import { NextRequest, NextResponse } from "next/server";
import { getToken, encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { TOTP as TOTPClass } from "otplib";
import { parseBody, MfaVerifySchema } from "@/lib/validation";
import { decryptTotpSecret } from "@/lib/totp";
import { checkMfaRateLimit, recordMfaAttempt } from "@/lib/mfaTotpRateLimit";
import { log } from "@/lib/logger";

const totp = new TOTPClass();

const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const userId = token.id as string;

  let allowed: boolean;
  try {
    allowed = await checkMfaRateLimit(userId);
  } catch {
    log.error("mfa-verify: rate-limit check failed", { userId });
    await log.flush();
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  const parsed = await parseBody(request, MfaVerifySchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const { code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpEnabled) {
    return NextResponse.json({ error: "MFA not configured" }, { status: 400 });
  }

  const secret = decryptTotpSecret(user.totpSecret!);
  const isValid = totp.verify(code, { secret });

  if (!isValid) {
    try {
      await recordMfaAttempt(userId, false);
    } catch {
      log.error("mfa-verify: failed to record failed attempt", { userId });
      await log.flush();
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Invalid code. Check your authenticator app." },
      { status: 400 }
    );
  }

  try {
    await recordMfaAttempt(userId, true);
  } catch {
    log.error("mfa-verify: failed to record successful attempt", { userId });
    await log.flush();
    // Allow login — TOTP code already verified
  }

  const newToken = { ...token, totpPending: false };
  const encoded = await encode({
    token: newToken,
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60,
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}
