import { BRAND } from "../brand";

export function buildOrderConfirmationEmail({
  customerName,
  orderId,
  invoiceNo,
  items,
  subtotal,
  taxTotal,
  shippingFee,
  total,
  address,
  city,
  state,
  zipCode,
}: {
  customerName: string;
  orderId: string;
  invoiceNo: string;
  items: { title: string; size: string; quantity: number; price: number }[];
  subtotal: number;
  taxTotal: number;
  shippingFee: number;
  total: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}) {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;">
          <strong>${item.title}</strong><br/>
          <span style="color:#888;font-size:12px;">Size: ${item.size}</span>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <!-- Header -->
      <div style="background:#006A38;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">
          ${BRAND.name}
        </h1>
        <p style="color:#FFF8E1;margin:6px 0 0;font-size:13px;">${BRAND.tagline}</p>
      </div>

      <!-- Success Banner -->
      <div style="background:#f0fdf4;border-left:4px solid #006A38;padding:20px 32px;">
        <h2 style="color:#166534;margin:0 0 6px;font-size:18px;">✅ Order Confirmed!</h2>
        <p style="color:#166534;margin:0;font-size:14px;">
          Thank you, <strong>${customerName}</strong>! Your payment has been received and your order is confirmed.
        </p>
      </div>

      <div style="padding:28px 32px;">
        <!-- Order Meta -->
        <table style="width:100%;margin-bottom:24px;font-size:13px;color:#555;">
          <tr>
            <td style="padding:4px 0;"><strong>Order ID:</strong></td>
            <td style="text-align:right;">${orderId.slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><strong>Invoice No:</strong></td>
            <td style="text-align:right;">${invoiceNo}</td>
          </tr>
        </table>

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;">Item</th>
              <th style="padding:10px 8px;text-align:center;font-size:11px;text-transform:uppercase;color:#999;">Qty</th>
              <th style="padding:10px 8px;text-align:right;font-size:11px;text-transform:uppercase;color:#999;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <!-- Totals -->
        <table style="width:240px;margin-left:auto;font-size:13px;color:#555;">
          <tr>
            <td style="padding:4px 0;">Subtotal</td>
            <td style="text-align:right;">₹${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;">GST</td>
            <td style="text-align:right;">₹${taxTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;">Shipping</td>
            <td style="text-align:right;color:#006A38;font-weight:bold;">${shippingFee === 0 ? "Free" : `₹${shippingFee.toFixed(2)}`}</td>
          </tr>
          <tr style="border-top:2px solid #e0e0e0;">
            <td style="padding:10px 0 4px;font-weight:900;font-size:15px;color:#212121;">Total</td>
            <td style="text-align:right;font-weight:900;font-size:15px;color:#006A38;">₹${total.toFixed(2)}</td>
          </tr>
        </table>

        <!-- Delivery Address -->
        <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin-top:24px;font-size:13px;color:#555;">
          <strong style="color:#212121;display:block;margin-bottom:8px;">📦 Delivery Address</strong>
          ${address}<br/>
          ${city}, ${state} – ${zipCode}
        </div>

        <!-- Note -->
        <div style="margin-top:24px;background:#FFF8E1;border-radius:8px;padding:14px 18px;font-size:12px;color:#8D6E63;">
          <strong>⚠️ Note:</strong> For bank transfer orders, please share your transaction reference / UTR number with us on WhatsApp or email to expedite dispatch.
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f5f5f5;padding:20px 32px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
        <p style="margin:0 0 6px;">${BRAND.name} | ${BRAND.address}</p>
        <p style="margin:0;">📞 ${BRAND.phone} &nbsp;|&nbsp; ✉️ ${BRAND.email}</p>
        <p style="margin:8px 0 0;color:#ccc;">© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
      </div>
    </div>
  `;

  return html;
}
