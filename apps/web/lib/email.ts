import { Resend } from 'resend';
import { prisma } from "@/lib/db";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  context?: string;
}

async function attemptSend({ to, subject, html }: SendEmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to,
    subject,
    html,
  });
}

export async function sendEmail(params: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured — email not sent:', params.subject);
    await logEmailFailure(params, 'RESEND_API_KEY not configured');
    return { success: false, error: 'Email not configured' };
  }

  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await attemptSend(params);
      return { success: true, result };
    } catch (error: any) {
      lastError = error;
      console.error(`Email send attempt ${attempt}/${maxAttempts} failed:`, error.message);

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000 - 1000));
      }
    }
  }

  await logEmailFailure(params, lastError?.message || 'Unknown error');
  return { success: false, error: lastError?.message };
}

async function logEmailFailure(params: SendEmailParams, errorMessage: string) {
  try {
    await prisma.failedEmail.create({
      data: {
        to: params.to,
        subject: params.subject,
        html: params.html,
        context: params.context || null,
        errorMessage,
      }
    });
  } catch (dbError) {
    console.error('Failed to log email failure to database:', dbError);
  }
}