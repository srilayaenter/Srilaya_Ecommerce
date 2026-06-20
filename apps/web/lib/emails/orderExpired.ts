import crypto from 'crypto';
import { BRAND } from '../brand';

const TOKEN_VALID_FOR_MS = 7 * 24 * 60 * 60 * 1000;

export function createResumeToken(orderId: string): string {
  const expiresAt = Date.now() + TOKEN_VALID_FOR_MS;
  const payload = `${orderId}:${expiresAt}`;
  const secret = process.env.NEXTAUTH_SECRET || '';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifyResumeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 3) return null;

    const [orderId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    const payload = `${orderId}:${expiresAtStr}`;
    const secret = process.env.NEXTAUTH_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) return null;

    return orderId;
  } catch {
    return null;
  }
}

export function buildOrderExpiredEmail({
  customerName,
  orderId,
  items,
  total,
}: {
  customerName: string;
  orderId: string;
  items: { title: string; size: string; quantity: number }[];
  total: number;
}) {
  const resumeToken = createResumeToken(orderId);
  const resumeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/resume/${resumeToken}`;

  const itemsList = items
    .map(item => `<li>${item.title} (${item.size}) × ${item.quantity}</li>`)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">${BRAND.name}</h2>
      <p>Hi ${customerName || 'there'},</p>
      <p>
        We noticed your order didn't complete payment, so we've released the
        reserved stock back into inventory. No charge was made to you.
      </p>
      <p><strong>Your order included:</strong></p>
      <ul>${itemsList}</ul>
      <p><strong>Total: ₹${total.toFixed(2)}</strong></p>
      <p>
        If this was a mistake or you'd still like these items, you can resume
        your order below. Note: if stock has since sold out, you may need to
        adjust quantities. This link is valid for 7 days.
      </p>
      <p style="margin: 24px 0;">
        <a href="${resumeUrl}"
           style="background:#4F46E5;color:white;padding:12px 24px;
                  border-radius:8px;text-decoration:none;font-weight:bold;">
          Resume My Order
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        This link will try to add the same items back to a new cart for you.
        If you didn't try to place this order, you can safely ignore this email.
      </p>
    </div>
  `;

  return { html, resumeUrl };
}