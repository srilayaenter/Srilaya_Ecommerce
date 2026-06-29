import { NextRequest, NextResponse } from "next/server";
import { getToken, encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { TOTP as TOTPClass } from "otplib";
import { parseBody, MfaVerifySchema } from "@/lib/validation";

const totp = new TOTPClass();

const COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

// Rate limit: 5 failed attempts per 15 minutes per user id
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

function checkMfaRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = failedAttempts.get(userId);
  if (!entry || now > entry.resetAt) return true;
  return entry.count < MAX_FAILS;
}

function recordFailure(userId: string) {
  const now = Date.now();
  const entry = failedAttempts.get(userId);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

function clearFailures(userId: string) {
  failedAttempts.delete(userId);
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const userId = token.id as string;

  if (!checkMfaRateLimit(userId)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  const parsed = await parseBody(request, MfaVerifySchema);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const { code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpEnabled) {
    return NextResponse.json({ error: "MFA not configured" }, { status: 400 });
  }

  // Decrypt secret before verifying
  const secret = decryptTotpSecret(user.totpSecret!);
  const isValid = totp.verify(code, { secret });

  if (!isValid) {
    recordFailure(userId);
    return NextResponse.json({ error: "Invalid code. Check your authenticator app." }, { status: 400 });
  }

  clearFailures(userId);

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

// ── TOTP secret encryption helpers ──────────────────────────────────────────
// Secrets are stored as "enc:<hex_iv>:<hex_ciphertext>" using AES-256-CBC
// keyed from NEXTAUTH_SECRET. Plain secrets (legacy) are accepted on read.

import crypto from "crypto";

function getEncKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
}

export function encryptTotpSecret(plain: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `enc:${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptTotpSecret(stored: string): string {
  if (!stored.startsWith("enc:")) return stored; // legacy plain value
  const [, ivHex, dataHex] = stored.split(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", getEncKey(), Buffer.from(ivHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
