import { prisma } from "./db";
import { sendEmail } from "./email";
import { BRAND } from "./brand";

export async function sendStockNotifications(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true, stockNotifications: { where: { notifiedAt: null } } },
  });
  if (!variant || variant.stockNotifications.length === 0) return;

  const cartUrl = `${process.env.NEXTAUTH_URL ?? "https://srilaya.com"}/product/${variant.product.slug}`;

  for (const notif of variant.stockNotifications) {
    await sendEmail({
      to: notif.email,
      subject: `Back in stock: ${variant.product.title} (${variant.size})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#212121;">
          <div style="background:#006A38;padding:24px 32px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:20px;">${BRAND.name}</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #E8E0D5;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="margin:0 0 8px;">🌾 It's back in stock!</h2>
            <p style="color:#616161;font-size:14px;">
              <strong>${variant.product.title} — ${variant.size}</strong> is now available again.
            </p>
            <a href="${cartUrl}"
              style="display:inline-block;background:#006A38;color:#fff;font-weight:bold;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;margin-top:16px;">
              Shop Now →
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#9E9E9E;">
              You asked to be notified when this item was back. This is a one-time alert.
            </p>
          </div>
        </div>
      `,
      context: `stock_notify:${notif.id}`,
    });

    await prisma.stockNotification.update({
      where: { id: notif.id },
      data:  { notifiedAt: new Date() },
    });
  }
}
