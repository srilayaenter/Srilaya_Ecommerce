import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/brand";

export async function POST(request: Request) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#006A38;padding:20px 28px;">
          <h2 style="color:#fff;margin:0;font-size:18px;">📩 New Contact Inquiry — ${BRAND.name}</h2>
        </div>
        <div style="padding:24px 28px;background:#fff;border:1px solid #e0e0e0;">
          <table style="width:100%;font-size:14px;color:#424242;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;font-weight:bold;width:120px;">Name</td>
              <td style="padding:8px 0;">${name}</td>
            </tr>
            <tr style="background:#f9f9f9;">
              <td style="padding:8px 0;font-weight:bold;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#006A38;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:bold;">Phone</td>
              <td style="padding:8px 0;">${phone || "Not provided"}</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:#FFF8E1;border-radius:8px;border-left:4px solid #8D6E63;">
            <strong style="font-size:13px;color:#212121;display:block;margin-bottom:8px;">Message:</strong>
            <p style="margin:0;font-size:14px;color:#555;white-space:pre-wrap;">${message}</p>
          </div>
        </div>
        <div style="padding:16px 28px;background:#f5f5f5;font-size:12px;color:#999;text-align:center;">
          Received via the Contact Us form on ${BRAND.name} website
        </div>
      </div>
    `;

    const adminEmail = process.env.ADMIN_EMAIL || BRAND.email;

    await sendEmail({
      to: adminEmail,
      subject: `New Inquiry from ${name} — ${BRAND.name} Website`,
      html,
      context: "contact-form",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
