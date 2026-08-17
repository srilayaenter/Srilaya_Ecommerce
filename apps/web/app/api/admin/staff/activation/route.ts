import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminRateLimit } from "@/lib/adminGuard";
import { issueActivationToken, buildActivationUrl } from "@/lib/staffActivation";
import { buildStaffActivationEmail } from "@/lib/emails/staffActivation";
import { sendEmail } from "@/lib/email";
import { parseBody, IssueActivationSchema } from "@/lib/validation";
import { logStaffActivationEvent } from "@/lib/logger";

// Only owner/admin may create staff accounts or (re)send activation links.
// Enforced here server-side, in addition to the /admin/users page's
// middleware-level path restriction — defense in depth.
function isAuthorised(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isAuthorised(session.user.role)) {
    logStaffActivationEvent({
      actorId: session?.user?.id,
      actorRole: session?.user?.role,
      result: "rejected_unauthorised",
    });
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rl = adminRateLimit(session.user.id ?? session.user.email ?? "unknown");
  if (rl) return rl;

  const parsed = await parseBody(request, IssueActivationSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const { email, role } = parsed.data;
  const normalised = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({ where: { email: normalised } });
  if (!user) {
    if (!role) {
      return NextResponse.json({ error: "Role is required to create a new staff account" }, { status: 400 });
    }
    // No password is set — the account cannot sign in until the activation
    // link is redeemed (authorize() in lib/auth.ts already rejects users
    // with no password).
    user = await prisma.user.create({ data: { email: normalised, role, active: true } });
  } else if (role) {
    user = await prisma.user.update({ where: { id: user.id }, data: { role } });
  }

  const rawToken = await issueActivationToken(user.id);
  const activationUrl = buildActivationUrl(rawToken);

  const emailResult = await sendEmail({
    to: normalised,
    subject: "Activate your SriLaYa staff account",
    html: buildStaffActivationEmail({ activationUrl }),
    context: `staff_activation:${user.id}`,
  });

  logStaffActivationEvent({
    userId: user.id,
    actorId: session.user.id,
    actorRole: session.user.role,
    result: emailResult.success ? "issued" : "email_delivery_failed",
  });

  if (!emailResult.success) {
    // Token was still created — the admin can retry sending, or share the
    // link out-of-band. sendEmail() already recorded the failure in
    // FailedEmail for visibility at /admin/failed-emails.
    return NextResponse.json(
      { success: true, emailDelivered: false, warning: "Activation link created, but the email could not be sent." },
      { status: 200 },
    );
  }

  return NextResponse.json({ success: true, emailDelivered: true });
}
