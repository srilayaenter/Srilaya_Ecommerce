import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export function adminRateLimit(userId: string): NextResponse | null {
  if (!checkRateLimit(`admin:${userId}`, 100, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return null;
}
