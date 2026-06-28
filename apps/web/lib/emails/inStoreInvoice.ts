import { BRAND } from "../brand";

export function buildInStoreInvoiceEmail({
  customerName,
  orderId,
  invoiceNo,
  items,
  subtotal,
  taxTotal,
  total,
  paymentMethod,
  phone,
  createdAt,
}: {
  customerName: string;
  orderId: string;
  invoiceNo?: string | null;
  items: { title: string; size: string; quantity: number; price: number; gstRate: number }[];
  subtotal: number;
  taxTotal: number;
  total: number;
  paymentMethod?: string | null;
  phone?: string | null;
  createdAt: Date;
}) {
  const paymentLabel: Record<string, string> = {
    cash:          'Cash',
    upi:           'UPI',
    card:          'Card (POS)',
    bank_transfer: 'Bank Transfer',
  };

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;">
        <strong>${item.title}</strong><br/>
        <span style="color:#888;font-size:12px;">Size: ${item.size}</span>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${item.price.toFixed(2)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">
        ₹${(item.price * item.quantity * item.gstRate / 100).toFixed(2)}
        <span style="color:#999;font-size:10px;display:block;">${item.gstRate}%</span>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold;">
        ₹${(item.price * item.quantity * (1 + item.gstRate / 100)).toFixed(2)}
      </td>
    </tr>`).join('');

  const dateStr = createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">

      <!-- Header -->
      <div style="background:#006A38;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;">${BRAND.name}</h1>
          <p style="color:#FFF8E1;margin:4px 0 0;font-size:12px;">GSTIN: ${BRAND.gstin}</p>
          <p style="color:#FFF8E1;margin:2px 0 0;font-size:12px;">${BRAND.address}</p>
        </div>
        <div style="text-align:right;">
          <div style="background:#FFF8E1;color:#006A38;font-weight:900;font-size:13px;padding:6px 14px;border-radius:20px;letter-spacing:0.5px;">
            IN-STORE RECEIPT
          </div>
        </div>
      </div>

      <!-- Invoice Meta -->
      <div style="padding:20px 32px;background:#f9f9f9;border-bottom:1px solid #e0e0e0;">
        <table style="width:100%;font-size:13px;color:#555;">
          <tr>
            <td style="padding:3px 0;"><strong style="color:#212121;">Order ID:</strong></td>
            <td style="text-align:right;font-family:monospace;font-weight:bold;color:#006A38;">#${orderId.slice(0, 8).toUpperCase()}</td>
          </tr>
          ${invoiceNo ? `<tr><td style="padding:3px 0;"><strong style="color:#212121;">Invoice No:</strong></td><td style="text-align:right;">${invoiceNo}</td></tr>` : ''}
          <tr>
            <td style="padding:3px 0;"><strong style="color:#212121;">Date &amp; Time:</strong></td>
            <td style="text-align:right;">${dateStr}, ${timeStr}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;"><strong style="color:#212121;">Customer:</strong></td>
            <td style="text-align:right;">${customerName}${phone ? ` · ${phone}` : ''}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;"><strong style="color:#212121;">Payment:</strong></td>
            <td style="text-align:right;">
              <span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-weight:bold;font-size:12px;">
                ✓ PAID · ${paymentLabel[paymentMethod ?? ''] ?? paymentMethod ?? 'In-Store'}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Items -->
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:10px 8px;text-align:left;font-size:10px;text-transform:uppercase;color:#999;font-weight:700;">Item</th>
              <th style="padding:10px 8px;text-align:center;font-size:10px;text-transform:uppercase;color:#999;font-weight:700;">Qty</th>
              <th style="padding:10px 8px;text-align:right;font-size:10px;text-transform:uppercase;color:#999;font-weight:700;">Rate</th>
              <th style="padding:10px 8px;text-align:right;font-size:10px;text-transform:uppercase;color:#999;font-weight:700;">GST</th>
              <th style="padding:10px 8px;text-align:right;font-size:10px;text-transform:uppercase;color:#999;font-weight:700;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <!-- Totals -->
        <table style="width:260px;margin-left:auto;margin-top:16px;font-size:13px;color:#555;border-top:1px solid #e0e0e0;">
          <tr>
            <td style="padding:6px 0;">Subtotal (excl. GST)</td>
            <td style="text-align:right;">₹${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;">GST</td>
            <td style="text-align:right;">₹${taxTotal.toFixed(2)}</td>
          </tr>
          <tr style="border-top:2px solid #006A38;">
            <td style="padding:10px 0 4px;font-weight:900;font-size:16px;color:#212121;">Total Paid</td>
            <td style="text-align:right;font-weight:900;font-size:16px;color:#006A38;">₹${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
        <p style="margin:0 0 4px;">Thank you for shopping with <strong style="color:#006A38;">${BRAND.name}</strong>!</p>
        <p style="margin:0;">📞 ${BRAND.phone} &nbsp;|&nbsp; ✉️ ${BRAND.email}</p>
        <p style="margin:8px 0 0;font-size:10px;color:#bbb;">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  `;
}

export function buildWhatsAppInvoiceText({
  customerName,
  orderId,
  items,
  total,
  paymentMethod,
  createdAt,
}: {
  customerName: string;
  orderId: string;
  items: { title: string; size: string; quantity: number }[];
  total: number;
  paymentMethod?: string | null;
  createdAt: Date;
}): string {
  const paymentLabel: Record<string, string> = {
    cash: 'Cash', upi: 'UPI', card: 'Card (POS)', bank_transfer: 'Bank Transfer',
  };

  const dateStr = createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const itemLines = items.map(i => `  • ${i.title} (${i.size}) × ${i.quantity}`).join('\n');

  return [
    `🙏 Hello ${customerName},`,
    ``,
    `Thank you for your purchase at *${BRAND.name}*!`,
    ``,
    `📋 *Receipt — #${orderId.slice(0, 8).toUpperCase()}*`,
    `📅 ${dateStr}`,
    ``,
    `*Items:*`,
    itemLines,
    ``,
    `💰 *Total Paid: ₹${total.toFixed(2)}* (incl. GST)`,
    `✅ Payment: ${paymentLabel[paymentMethod ?? ''] ?? paymentMethod ?? 'In-Store'}`,
    ``,
    `For any queries, reply to this message or call ${BRAND.phone}.`,
    ``,
    `_${BRAND.name} · ${BRAND.address}_`,
  ].join('\n');
}
