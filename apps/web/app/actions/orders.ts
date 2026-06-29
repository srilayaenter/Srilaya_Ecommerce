'use server';

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { toNum } from "@/lib/decimal";
import { sendEmail } from "@/lib/email";
import { buildLowStockAlert } from "@/lib/emails/adminAlerts";

export async function createOrder(formData: FormData): Promise<void> {
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  if (!cartId) redirect('/cart');

  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    include: { variant: { include: { product: true } } },
  });

  if (cartItems.length === 0) redirect('/cart');

  let subtotal = 0;
  let taxTotal = 0;

  cartItems.forEach((item) => {
    const price = toNum(item.price);
    const gst   = toNum(item.gstRate);
    subtotal += price * item.quantity;
    taxTotal += (price * item.quantity * gst) / 100;
  });

  const customerName  = formData.get('name')        as string;
  const email         = formData.get('email')       as string;
  const phone         = formData.get('phone')       as string;
  const address       = formData.get('address')     as string;
  const city          = formData.get('city')        as string;
  const state         = formData.get('state')       as string;
  const zipCode       = formData.get('zipCode')     as string;
  const courierName   = formData.get('courierName') as string;
  const shippingFee   = parseFloat(formData.get('shippingFee') as string) || 0;
  const paymentMethod = formData.get('paymentMethod') as string | null;

  const total = subtotal + taxTotal + shippingFee;

  let orderId: string;

  try {
    orderId = await prisma.$transaction(async (tx) => {
      // Reserve stock
      for (const item of cartItems) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data:  { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          throw new Error(
            `INSUFFICIENT_STOCK:${item.variant.product.title} (${item.variant.size})`
          );
        }
      }

      const order = await tx.order.create({
        data: {
          customerName,
          email,
          phone,
          address,
          city,
          state,
          zipCode,
          subtotal,
          taxTotal,
          shippingFee,
          total,
          currency: 'INR',
          status: 'pending',
          orderChannel: 'online',
          paymentMethod: paymentMethod || undefined,
          // Store courier name in paymentId temporarily until shipped; will be overwritten by Razorpay payment id on payment
          // Better: use a dedicated field — for now store in invoiceNo prefix
          invoiceNo: courierName ? `COURIER:${courierName}` : undefined,
        },
      });

      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId:   order.id,
            variantId: item.variantId,
            quantity:  item.quantity,
            price:     item.price,
            gstRate:   item.gstRate,
          },
        });
      }

      return order.id;
    });
  } catch (err: any) {
    if (typeof err.message === 'string' && err.message.startsWith('INSUFFICIENT_STOCK:')) {
      const info = err.message.replace('INSUFFICIENT_STOCK:', '');
      redirect(`/checkout?error=${encodeURIComponent(`Not enough stock for ${info}`)}`);
    }
    throw err;
  }

  // Real-time low stock alert — fire and forget, don't block checkout
  if (process.env.ADMIN_ALERT_EMAIL) {
    prisma.productVariant.findMany({
      where: {
        id: { in: cartItems.map(i => i.variantId) },
      },
      include: { product: true },
    }).then(variants => {
      const low = variants.filter(v => v.stock <= v.reorderThreshold);
      if (low.length > 0) {
        sendEmail({
          to: process.env.ADMIN_ALERT_EMAIL!,
          subject: `Low stock alert — ${low.length} item(s) after order ${orderId.slice(0, 8).toUpperCase()}`,
          html: buildLowStockAlert({
            variants: low.map(v => ({
              productTitle: v.product.title,
              size: v.size,
              stock: v.stock,
              sku: v.sku,
            })),
          }),
          context: 'admin_alert_low_stock',
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  redirect(`/checkout/pay/${orderId}`);
}
