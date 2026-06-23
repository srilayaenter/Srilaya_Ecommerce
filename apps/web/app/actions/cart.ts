'use server';

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function addToCart(variantId: string, quantity: number = 1) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });

    if (!variant) {
      return { success: false, error: "Product variant not found" };
    }

    if (variant.stock < quantity) {
      return { success: false, error: "Insufficient stock" };
    }

    const cookieStore = await cookies();
    let cartId = cookieStore.get('cartId')?.value;

    if (!cartId) {
      const newCart = await prisma.cart.create({
        data: { userId: null }
      });
      cartId = newCart.id;

      cookieStore.set('cartId', cartId, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        path: '/',
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cartId, variantId: variantId }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cartId,
          variantId: variantId,
          quantity: quantity,
          price: variant.price,
          gstRate: variant.product.gstRate,
        }
      });
    }

    return { success: true };

  } catch (error: any) {
    console.error("addToCart server action error:", error);
    return { success: false, error: error.message };
  }
}