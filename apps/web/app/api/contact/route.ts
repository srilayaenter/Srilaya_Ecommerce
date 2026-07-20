import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/brand";
import { checkRateLimit, getIp } from "@/lib/rateLimit";

function h(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3 contact submissions per hour per IP (validate first so invalid requests don't count)
    if (!checkRateLimit(`contact:${getIp(request)}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
    }

    const safeName    = h(name    ?? "");
    const safeEmail   = h(email   ?? "");
    const safePhone   = h(phone   ?? "");
    const safeMessage = h(message ?? "");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#006A38;padding:20px 28px;">
          <h2 style="color:#fff;margin:0;font-size:18px;">📩 New Contact Inquiry — ${BRAND.name}</h2>
        </div>
        <div style="padding:24px 28px;background:#fff;border:1px solid #e0e0e0;">
          <table style="width:100%;font-size:14px;color:#424242;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;font-weight:bold;width:120px;">Name</td>
              <td style="padding:8px 0;">${safeName}</td>
            </tr>
            <tr style="background:#f9f9f9;">
              <td style="padding:8px 0;font-weight:bold;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#006A38;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:bold;">Phone</td>
              <td style="padding:8px 0;">${safePhone || "Not provided"}</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:#FFF8E1;border-radius:8px;border-left:4px solid #8D6E63;">
            <strong style="font-size:13px;color:#212121;display:block;margin-bottom:8px;">Message:</strong>
            <p style="margin:0;font-size:14px;color:#555;white-space:pre-wrap;">${safeMessage}</p>
          </div>
        </div>
        <div style="padding:16px 28px;background:#f5f5f5;font-size:12px;color:#999;text-align:center;">
          Received via the Contact Us form on ${BRAND.name} website
        </div>
      </div>
    `;

    const adminEmail = process.env.ADMIN_EMAIL || BRAND.email;

    // Notify admin
    await sendEmail({
      to: adminEmail,
      subject: `New Inquiry from ${safeName} — ${BRAND.name} Website`,
      html,
      context: "contact-form",
    });

    // Auto-reply to customer
    const replyHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#006A38;padding:20px 28px;">
          <h2 style="color:#fff;margin:0;font-size:18px;">Thank you for reaching out, ${safeName}!</h2>
        </div>
        <div style="padding:24px 28px;background:#fff;border:1px solid #e0e0e0;font-size:14px;color:#424242;line-height:1.7;">
          <p>We've received your message and our team will get back to you within <strong>1 business day</strong> (Mon–Sat, 9 AM – 6 PM IST).</p>
          <p>For urgent queries, you can also reach us directly:</p>
          <ul style="padding-left:18px;color:#555;">
            <li>📞 Phone / WhatsApp: <strong>${BRAND.phone}</strong></li>
            <li>✉️ Email: <a href="mailto:${BRAND.email}" style="color:#006A38;">${BRAND.email}</a></li>
          </ul>
          <div style="margin-top:20px;padding:14px 18px;background:#f9f9f9;border-radius:8px;border-left:4px solid #006A38;font-size:13px;color:#616161;">
            <strong>Your message:</strong><br/>
            <span style="white-space:pre-wrap;">${safeMessage}</span>
          </div>
        </div>
        <div style="padding:16px 28px;background:#f5f5f5;font-size:12px;color:#999;text-align:center;">
          ${BRAND.name} · ${BRAND.address}
        </div>
      </div>
    `;

    sendEmail({
      to: email,
      subject: `We received your message — ${BRAND.name}`,
      html: replyHtml,
      context: "contact-autoreply",
    }).catch(() => {}); // fire-and-forget, don't block response

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
