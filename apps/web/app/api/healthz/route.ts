import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const BUILD_TIME = new Date().toISOString();

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "unknown db error";
  }

  const healthy = dbStatus === "ok";
  const payload = {
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: Date.now() - start,
    build: {
      nodeVersion: process.version,
      deployedAt: BUILD_TIME,
      env: process.env.NODE_ENV ?? "unknown",
    },
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
    },
  };

  return NextResponse.json(payload, {
    status: healthy ? 200 : 503,
    headers: {
      // Prevent caches from serving a stale healthy response
      "Cache-Control": "no-store",
    },
  });
}
