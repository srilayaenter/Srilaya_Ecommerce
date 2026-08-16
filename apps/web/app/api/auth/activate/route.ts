import { NextResponse } from "next/server";
import { redeemActivationToken } from "@/lib/staffActivation";
import { parseBody, ActivateAccountSchema } from "@/lib/validation";
import { checkRateLimit, getIp } from "@/lib/rateLimit";
import { logStaffActivationEvent } from "@/lib/logger";

const GENERIC_ERROR = "This activation link is invalid or has expired. Please ask an administrator to send a new one.";

export async function POST(request: Request) {
  try {
    // 10 attempts per hour per IP — same budget as reset-password.
    if (!checkRateLimit(`activate:${getIp(request)}`, 10, 60 * 60 * 1000)) {
      logStaffActivationEvent({ result: "rejected_rate_limited" });
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const parsed = await parseBody(request, ActivateAccountSchema);
    if (!parsed.ok) {
      logStaffActivationEvent({ result: "rejected_malformed" });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }
    const { token, password } = parsed.data;

    const result = await redeemActivationToken(token, password);

    if (!result.ok) {
      logStaffActivationEvent({ result: `rejected_${result.reason}` as const });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    logStaffActivationEvent({ userId: result.userId, result: "redeemed" });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Activate account error:", error.message);
    return NextResponse.json({ error: "Failed to activate account" }, { status: 500 });
  }
}
