import { BRAND } from "../brand";

export function buildAbandonedCartEmail({
  items,
  cartUrl,
}: {
  items: { title: string; size: string; quantity: number }[];
  cartUrl: string;
}) {
  const itemRows = items
    .map(i => `<li style="margin-bottom:4px;">${i.title} <span style="color:#8D6E63;">(${i.size}) × ${i.quantity}</span></li>`)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#212121;">
      <div style="background:#006A38;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">${BRAND.name}</h1>
        <p style="color:#FFF8E1;margin:4px 0 0;font-size:13px;">${BRAND.tagline}</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #E8E0D5;border-top:none;border-radius:0 0 12px 12px;">
        <h2 style="margin:0 0 8px;font-size:20px;">You left something behind 🌾</h2>
        <p style="color:#616161;font-size:14px;margin:0 0 20px;">
          Your cart is waiting! Come back and complete your order.
        </p>
        <p style="font-size:13px;font-weight:bold;color:#9E9E9E;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px;">Items in your cart</p>
        <ul style="padding-left:18px;font-size:14px;margin:0 0 24px;">${itemRows}</ul>
        <a href="${cartUrl}"
          style="display:inline-block;background:#006A38;color:#fff;font-weight:bold;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Complete My Order →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9E9E9E;">
          Questions? Reply to this email or call <a href="tel:${BRAND.phone}" style="color:#006A38;">${BRAND.phone}</a>
        </p>
      </div>
    </div>
  `;
}
