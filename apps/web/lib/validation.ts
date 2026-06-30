import { z } from "zod";

export const TrackOrderSchema = z.object({
  orderId: z.string().min(1).max(64).regex(/^[A-Za-z0-9#\-]+$/, "Invalid order ID"),
  contact: z.string().min(1).max(100),
});

export const MfaVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, "Code must be 6 digits"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").max(200),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8).max(128),
});

export const CancelOrderSchema = z.object({
  orderId: z.string().min(1).max(64),
  email: z.string().email().max(200),
});

export const CouponApplySchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Za-z0-9\-_]+$/, "Invalid coupon code"),
  orderTotal: z.number().positive(),
});

export const NotifyStockSchema = z.object({
  email: z.string().email().max(200),
  variantId: z.string().min(1).max(64),
});

export const ReturnRequestSchema = z.object({
  orderId: z.string().min(1).max(64),
  contact: z.string().min(1).max(100),
  reason: z.string().min(5).max(500),
  items: z.array(z.object({
    variantId: z.string().min(1).max(64),
    title:     z.string().min(1).max(200),
    size:      z.string().min(1).max(50),
    quantity:  z.number().int().positive(),
  })).min(1),
});

/** Parse request body with a Zod schema. Returns `{ ok: true, data }` or `{ ok: false, error, status }`. */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, error: "Invalid JSON body", status: 400 };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues.map((i: z.ZodIssue) => i.message).join("; ");
    return { ok: false, error: msg, status: 400 };
  }
  return { ok: true, data: result.data };
}
