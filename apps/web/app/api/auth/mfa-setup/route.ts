import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSecret, generateURI } from "otplib";
import { TOTP as TOTPClass } from "otplib";
import QRCode from "qrcode";
import { encryptTotpSecret, decryptTotpSecret } from "@/app/api/auth/mfa-verify/route";

const totp = new TOTPClass();

// GET — generate a new TOTP secret and QR code for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const secret = generateSecret();
  const otpauth = generateURI({ secret, label: session.user.email ?? "admin", issuer: "SriLaYa Admin" });
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  // Store encrypted secret (not enabled yet — user must verify first)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: encryptTotpSecret(secret), totpEnabled: false },
  });

  return NextResponse.json({ secret, qrDataUrl });
}

// POST — verify a TOTP code and enable MFA
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { code } = await request.json();
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.totpSecret) return NextResponse.json({ error: "No MFA setup in progress" }, { status: 400 });

  const secret = decryptTotpSecret(user.totpSecret);
  const isValid = totp.verify(code, { secret });
  if (!isValid) return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });

  await prisma.user.update({ where: { id: session.user.id }, data: { totpEnabled: true } });
  return NextResponse.json({ success: true });
}

// DELETE — disable MFA
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: false, totpSecret: null },
  });
  return NextResponse.json({ success: true });
}
