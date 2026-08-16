import { BRAND } from "../brand";

export function buildStaffActivationEmail({
  activationUrl,
}: {
  activationUrl: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#006A38;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:900;">${BRAND.name}</h1>
        <p style="color:#FFF8E1;margin:6px 0 0;font-size:13px;">Admin Portal</p>
      </div>

      <div style="padding:32px;">
        <h2 style="color:#212121;margin:0 0 12px;font-size:20px;">Activate your staff account</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
          An administrator has created a staff account for you.
          Click the button below to set your password and activate your account. This link expires in <strong>1 hour</strong>.
        </p>

        <div style="text-align:center;margin:32px 0;">
          <a href="${activationUrl}"
             style="background:#006A38;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">
            Activate Account
          </a>
        </div>

        <p style="color:#888;font-size:12px;line-height:1.6;margin:0;">
          If you weren't expecting this, you can safely ignore this email.<br/>
          If the button doesn't work, copy and paste this URL into your browser:<br/>
          <a href="${activationUrl}" style="color:#006A38;word-break:break-all;">${activationUrl}</a>
        </p>
      </div>

      <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
        <p style="margin:0;">${BRAND.name} | ${BRAND.address}</p>
        <p style="margin:4px 0 0;">📞 ${BRAND.phone} &nbsp;|&nbsp; ✉️ ${BRAND.email}</p>
      </div>
    </div>
  `;
}
