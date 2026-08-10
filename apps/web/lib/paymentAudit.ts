import { prisma } from "@/lib/db";

export type PaymentEventType =
  | "payment.initiated"
  | "payment.verified"
  | "payment.failed"
  | "payment.captured_webhook"
  | "payment.failed_webhook"
  | "payment.signature_invalid"
  | "payment.mismatch";

interface PaymentAuditParams {
  eventType: PaymentEventType;
  status: string;
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount?: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logPaymentEvent(params: PaymentAuditParams): Promise<void> {
  try {
    await prisma.paymentAuditLog.create({
      data: {
        eventType:         params.eventType,
        status:            params.status,
        orderId:           params.orderId ?? null,
        razorpayOrderId:   params.razorpayOrderId ?? null,
        razorpayPaymentId: params.razorpayPaymentId ?? null,
        amount:            params.amount ?? null,
        userId:            params.userId ?? null,
        ipAddress:         params.ipAddress ?? null,
        userAgent:         params.userAgent ?? null,
        metadata:          params.metadata ? (params.metadata as object) : undefined,
      },
    });
  } catch {
    // Audit logging must never crash the payment flow
  }
}
