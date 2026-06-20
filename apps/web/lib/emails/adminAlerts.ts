import { BRAND } from "../brand";

export function buildPaymentFailedAlert({
  orderId,
  customerName,
  customerEmail,
  total,
}: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color:#DC2626;">⚠️ Payment Failed</h2>
      <p>Order <strong>${orderId.slice(0, 8).toUpperCase()}</strong> had a failed payment.</p>
      <p>Customer: ${customerName} (${customerEmail})</p>
      <p>Amount: ₹${total.toFixed(2)}</p>
      <p>Stock for this order has been released back to inventory automatically.</p>
    </div>
  `;
}

export function buildLowStockAlert({
  variants,
}: {
  variants: { productTitle: string; size: string; stock: number; sku: string }[];
}) {
  const rows = variants
    .map(v => `<li>${v.productTitle} (${v.size}) — ${v.stock} left [${v.sku}]</li>`)
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color:#D97706;">📦 Low Stock Alert</h2>
      <p>The following ${BRAND.name} items are running low:</p>
      <ul>${rows}</ul>
    </div>
  `;
}