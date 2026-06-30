import twilio from "twilio";

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    // Dev fallback — log OTP to console when Twilio is not configured
    console.log(`[DEV] OTP for +91${phone}: ${otp}`);
    return;
  }

  const client = twilio(accountSid, authToken);
  await client.messages.create({
    body: `Your SriLaYa OTP is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
    from,
    to: `+91${phone}`,
  });
}
