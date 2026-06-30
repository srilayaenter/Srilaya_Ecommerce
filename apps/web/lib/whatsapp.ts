import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const from       = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886"; // Twilio sandbox default

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (!accountSid || !authToken) return; // Silently skip if not configured

  const phone = to.replace(/\D/g, "");
  if (phone.length < 10) return;

  const e164 = phone.startsWith("91") ? `+${phone}` : `+91${phone}`;

  const client = twilio(accountSid, authToken);
  await client.messages.create({
    from,
    to: `whatsapp:${e164}`,
    body: message,
  });
}

export function orderConfirmedMessage({
  customerName,
  shortId,
  total,
  paymentMethod,
}: {
  customerName: string;
  shortId: string;
  total: number;
  paymentMethod: string;
}) {
  const payLabel = paymentMethod === "cod" ? "Cash on Delivery" : "Online";
  return `Hi ${customerName}! 🌾 Your SriLaYa Enterprises order *#${shortId}* has been placed successfully.\n\nTotal: ₹${total.toFixed(2)} | Payment: ${payLabel}\n\nTrack your order: ${process.env.NEXTAUTH_URL ?? "https://srilaya.com"}/track?orderId=${shortId}\n\nThank you for choosing SriLaYa!`;
}

export function orderDeliveredMessage({
  customerName,
  shortId,
}: {
  customerName: string;
  shortId: string;
}) {
  const storeUrl = process.env.NEXTAUTH_URL ?? "https://srilaya.com";
  return `Hi ${customerName}! ✅ Your SriLaYa Enterprises order *#${shortId}* has been delivered!\n\nWe hope you love your order. 🌾\n\nShare your experience: ${storeUrl}/product\n\nFor returns within 7 days: ${storeUrl}/track\n\nThank you for choosing SriLaYa! 🙏`;
}

export function orderDispatchedMessage({
  customerName,
  shortId,
  courier,
  trackingNumber,
  trackingUrl,
}: {
  customerName: string;
  shortId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl?: string | null;
}) {
  const trackLine = trackingUrl ? `\nTrack shipment: ${trackingUrl}` : "";
  return `Hi ${customerName}! 🚚 Your SriLaYa Enterprises order *#${shortId}* has been dispatched!\n\nCourier: ${courier}\nTracking No: ${trackingNumber}${trackLine}\n\nExpect delivery in 3–7 business days.`;
}
