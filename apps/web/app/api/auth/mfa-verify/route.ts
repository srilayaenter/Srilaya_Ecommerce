import { NextRequest, NextResponse } from "next/server";
import { getToken, encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { TOTP as TOTPClass } from "otplib";
const totp = new TOTPClass();

const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: token.id as string } });
  if (!user?.totpSecret || !user.totpEnabled) {
    return NextResponse.json({ error: "MFA not configured" }, { status: 400 });
  }

  const isValid = totp.verify(code, { secret: user.totpSecret });
  if (!isValid) return NextResponse.json({ error: "Invalid code. Check your authenticator app." }, { status: 400 });

  // Re-encode JWT with totpPending removed
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
