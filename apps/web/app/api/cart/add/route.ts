import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { variantId, quantity = 1 } = await request.json();

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant ID is required" },
        { status: 400 }
      );
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });

    if (!variant) {
      return NextResponse.json(
        { error: "Product variant not found" },
        { status: 404 }
      );
    }

    if (variant.stock < quantity) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 }
      );
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
      where: {
        cartId: cartId,
        variantId: variantId,
      }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        }
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

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cartId }
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      success: true,
      message: "Product added to cart",
      cartCount: totalItems,
    });

  } catch (error: any) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Failed to add to cart", details: error.message },
      { status: 500 }
    );
  }
}