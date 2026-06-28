'use server';

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { toNum } from "@/lib/decimal";

export async function createOfflineOrder(formData: FormData): Promise<void> {
  const customerName  = formData.get('customerName') as string;
  const phone         = (formData.get('phone') as string) || undefined;
  const email         = (formData.get('email') as string) || undefined;
  const paymentMethod = formData.get('paymentMethod') as string;
  const notes         = (formData.get('notes') as string) || undefined;

  // Items are submitted as variantId_N and qty_N pairs
  const items: { variantId: string; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('variantId_')) {
      const idx = key.replace('variantId_', '');
      const qty = parseInt(formData.get(`qty_${idx}`) as string, 10);
      if (value && qty > 0) {
        items.push({ variantId: value as string, quantity: qty });
      }
    }
  }

  if (items.length === 0) {
    redirect('/admin/orders/new?error=no_items');
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map(i => i.variantId) } },
    include: { product: true },
  });

  let subtotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const v = variants.find(v => v.id === item.variantId);
    if (!v) continue;
    const price = toNum(v.price);
    const gst   = toNum(v.product.gstRate);
    subtotal += price * item.quantity;
    taxTotal += (price * item.quantity * gst) / 100;
  }

  const total = subtotal + taxTotal;

  let orderId: string;

  try {
    orderId = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data:  { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          const v = variants.find(v => v.id === item.variantId);
          throw new Error(`INSUFFICIENT_STOCK:${v?.product.title ?? item.variantId}`);
        }
      }

      const order = await tx.order.create({
        data: {
          customerName,
          phone,
          email,
          subtotal,
          taxTotal,
          shippingFee: 0,
          total,
          currency:     'INR',
          status:       'paid',
          fulfillmentStatus: 'pending',
          orderChannel: 'in_store',
          paymentMethod,
          invoiceNo:    notes ? `NOTE:${notes}` : undefined,
        },
      });

      for (const item of items) {
        const v = variants.find(v => v.id === item.variantId)!;
        await tx.orderItem.create({
          data: {
            orderId:   order.id,
            variantId: item.variantId,
            quantity:  item.quantity,
            price:     v.price,
            gstRate:   v.product.gstRate,
          },
        });
      }

      return order.id;
    });
  } catch (err: any) {
    if (typeof err.message === 'string' && err.message.startsWith('INSUFFICIENT_STOCK:')) {
      const info = err.message.replace('INSUFFICIENT_STOCK:', '');
      redirect(`/admin/orders/new?error=${encodeURIComponent(`Not enough stock: ${info}`)}`);
    }
    throw err;
  }

  redirect(`/admin/orders/${orderId}/invoice`);
}
