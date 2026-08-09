import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import crypto from "crypto";

async function guard() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && isAdminRole(session.user.role);
}

// GET /api/admin/failed-webhooks — list unresolved failures
export async function GET() {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const items = await prisma.failedWebhook.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ items });
}

// POST /api/admin/failed-webhooks — replay a single failed webhook
export async function POST(request: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const failed = await prisma.failedWebhook.findUnique({ where: { id: body.id } });
  if (!failed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (failed.resolvedAt) return NextResponse.json({ error: "Already resolved" }, { status: 409 });

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Re-sign the raw body and replay against our own webhook endpoint
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(failed.rawBody)
    .digest("hex");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/payments/razorpay/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": signature,
    },
    body: failed.rawBody,
  });

  await prisma.failedWebhook.update({
    where: { id: body.id },
    data: {
      retries:    { increment: 1 },
      resolvedAt: res.ok ? new Date() : null,
      errorMessage: res.ok
        ? failed.errorMessage
        : `Retry failed with status ${res.status}`,
    },
  });

  return NextResponse.json({ ok: res.ok, status: res.status });
}
