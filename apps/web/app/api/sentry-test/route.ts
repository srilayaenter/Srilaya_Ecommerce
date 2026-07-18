import { NextResponse } from "next/server";

// Used only to verify Sentry error capture is working after deploy.
// Call GET /api/sentry-test?secret=<CRON_SECRET> to trigger a test event.
// Remove or restrict this route once Sentry is confirmed working in production.
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  throw new Error(
    "SriLaYa Sentry test — this error was triggered intentionally to verify Sentry capture is working."
  );
}
