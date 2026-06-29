import { BRAND } from "../brand";

export function buildDispatchEmail({
  customerName,
  shortId,
  courier,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
}: {
  customerName: string;
  shortId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl?: string | null;
  estimatedDelivery?: Date | null;
}) {
  const trackingLine = trackingUrl
    ? `<a href="${trackingUrl}" style="color:#006A38;font-weight:bold;">Track your package →</a>`
    : `Tracking No: <strong>${trackingNumber}</strong> via ${courier}`;

  const etaLine = estimatedDelivery
    ? `<p style="margin:8px 0 0;color:#555;font-size:13px;">Estimated delivery: <strong>${new Date(estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#006A38;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:900;">${BRAND.name}</h1>
        <p style="color:#FFF8E1;margin:6px 0 0;font-size:13px;">${BRAND.tagline}</p>
      </div>
      <div style="background:#e8f5e9;border-left:4px solid #006A38;padding:20px 32px;">
        <h2 style="color:#1b5e20;margin:0 0 6px;font-size:18px;">🚚 Your Order is On Its Way!</h2>
        <p style="color:#2e7d32;margin:0;font-size:14px;">
          Hi <strong>${customerName}</strong>! Your order <strong>#${shortId}</strong> has been dispatched.
        </p>
      </div>
      <div style="padding:28px 32px;">
        <div style="background:#f9f9f9;border-radius:8px;padding:20px 24px;font-size:14px;color:#424242;">
          <p style="margin:0 0 8px;font-weight:bold;color:#212121;">Shipment Details</p>
          <p style="margin:0;">Courier: <strong>${courier}</strong></p>
          <p style="margin:8px 0 0;">${trackingLine}</p>
          ${etaLine}
        </div>
        <div style="margin-top:24px;text-align:center;">
          <a href="${process.env.NEXTAUTH_URL ?? ""}/track?orderId=${shortId}"
            style="display:inline-block;background:#006A38;color:#fff;font-weight:bold;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:14px;">
            Track Your Order
          </a>
        </div>
      </div>
      <div style="background:#f5f5f5;padding:20px 32px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
        <p style="margin:0 0 6px;">${BRAND.name} | ${BRAND.address}</p>
        <p style="margin:0;">📞 ${BRAND.phone} &nbsp;|&nbsp; ✉️ ${BRAND.email}</p>
      </div>
    </div>`;
}

export function buildDeliveredEmail({
  customerName,
  shortId,
}: {
  customerName: string;
  shortId: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#006A38;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:900;">${BRAND.name}</h1>
        <p style="color:#FFF8E1;margin:6px 0 0;font-size:13px;">${BRAND.tagline}</p>
      </div>
      <div style="background:#e8f5e9;border-left:4px solid #006A38;padding:20px 32px;">
        <h2 style="color:#1b5e20;margin:0 0 6px;font-size:18px;">✅ Order Delivered!</h2>
        <p style="color:#2e7d32;margin:0;font-size:14px;">
          Hi <strong>${customerName}</strong>! Your order <strong>#${shortId}</strong> has been delivered. Enjoy!
        </p>
      </div>
      <div style="padding:28px 32px;text-align:center;">
        <p style="color:#555;font-size:14px;margin:0 0 24px;">
          We hope you love your order. If you have a moment, we'd appreciate a review — it helps other customers discover healthy millet foods.
        </p>
        <a href="${process.env.NEXTAUTH_URL ?? ""}/product"
          style="display:inline-block;background:#006A38;color:#fff;font-weight:bold;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:14px;margin-right:12px;">
          Shop Again
        </a>
        <a href="${process.env.NEXTAUTH_URL ?? ""}/track?orderId=${shortId}"
          style="display:inline-block;border:2px solid #006A38;color:#006A38;font-weight:bold;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;">
          View Order
        </a>
      </div>
      <div style="background:#FFF8E1;margin:0 32px 28px;border-radius:8px;padding:14px 18px;font-size:12px;color:#8D6E63;text-align:center;">
        If anything is wrong with your order, you can raise a return request within 7 days.
      </div>
      <div style="background:#f5f5f5;padding:20px 32px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
        <p style="margin:0 0 6px;">${BRAND.name} | ${BRAND.address}</p>
        <p style="margin:0;">📞 ${BRAND.phone} &nbsp;|&nbsp; ✉️ ${BRAND.email}</p>
      </div>
    </div>`;
}
