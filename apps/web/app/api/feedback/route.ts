import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/brand";

const TYPE_LABELS: Record<string, string> = {
  feature_request: "Feature Request",
  bug_report:      "Bug Report",
  product_feedback:"Product Feedback",
  general:         "General Feedback",
};

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const { type, subject, message, email, name } = body as Record<string, string>;

  if (!type || !message?.trim() || message.trim().length < 10) {
    return NextResponse.json({ error: "Message must be at least 10 characters." }, { status: 400 });
  }
  if (!TYPE_LABELS[type]) {
    return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
  }

  const label   = TYPE_LABELS[type];
  const from    = name?.trim() || "Anonymous";
  const replyTo = email?.trim() || null;
  const subj    = subject?.trim() || `${label} from ${from}`;

  if (process.env.ADMIN_ALERT_EMAIL) {
    sendEmail({
      to:      process.env.ADMIN_ALERT_EMAIL,
      subject: `[Feedback] ${label} — ${subj}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;">
        <h2 style="color:#006A38;">${label}</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#9E9E9E;width:100px;">From</td><td style="padding:4px 0;">${from}${replyTo ? ` &lt;${replyTo}&gt;` : ""}</td></tr>
          <tr><td style="padding:4px 0;color:#9E9E9E;">Subject</td><td style="padding:4px 0;">${subj}</td></tr>
          <tr><td style="padding:4px 0;color:#9E9E9E;">Type</td><td style="padding:4px 0;">${label}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #E0E0E0;margin:12px 0;">
        <p style="font-size:14px;line-height:1.6;color:#424242;">${message.replace(/\n/g, "<br>")}</p>
        ${replyTo ? `<p style="font-size:12px;color:#9E9E9E;margin-top:16px;">Reply directly to this email to respond to ${from}.</p>` : ""}
      </div>`,
      replyTo: replyTo ?? undefined,
      context: `feedback:${type}:${Date.now()}`,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
