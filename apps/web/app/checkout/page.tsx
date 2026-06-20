import { cookies } from "next/headers";
import { prisma } from "../../lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { toNum } from "../../lib/decimal";

async function createOrder(formData: FormData): Promise<void> {
  'use server';

  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  if (!cartId) {
    redirect('/cart');
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { cartId: cartId },
    include: {
      variant: { include: { product: true } }
    }
  });

  if (cartItems.length === 0) {
    redirect('/cart');
  }

  let subtotal = 0;
  let taxTotal = 0;

  cartItems.forEach(item => {
    const price = toNum(item.price);
    const gstRate = toNum(item.gstRate);
    subtotal += price * item.quantity;
    taxTotal += (price * item.quantity * gstRate) / 100;
  });

  const total = subtotal + taxTotal;

  const customerName = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;

  let orderId: string;

  try {
    orderId = await prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        const result = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity }
          },
          data: {
            stock: { decrement: item.quantity }
          }
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
          shippingFee: 0,
          total,
          currency: 'INR',
          status: 'pending',
        }
      });

      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            gstRate: item.gstRate,
          }
        });
      }

      return order.id;
    });
  } catch (err: any) {
    if (typeof err.message === 'string' && err.message.startsWith('INSUFFICIENT_STOCK:')) {
      const productInfo = err.message.replace('INSUFFICIENT_STOCK:', '');
      redirect(`/checkout?error=${encodeURIComponent(`Not enough stock for ${productInfo}`)}`);
    }
    throw err;
  }

  redirect(`/checkout/pay/${orderId}`);
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams;

  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  let cartItems: any[] = [];
  let subtotal = 0;
  let taxTotal = 0;

  if (cartId) {
    cartItems = await prisma.cartItem.findMany({
      where: { cartId: cartId },
      include: {
        variant: { include: { product: true } }
      }
    });

    subtotal = cartItems.reduce((sum, item) => sum + (toNum(item.price) * item.quantity), 0);
    taxTotal = cartItems.reduce((sum, item) => {
      const price = toNum(item.price);
      const gstRate = toNum(item.gstRate);
      return sum + (price * item.quantity * gstRate / 100);
    }, 0);
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/category/millets">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  const total = subtotal + taxTotal;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

            <form action={createOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 outline-none"
                  placeholder="Street address, apartment, suite, etc."
                ></textarea>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="Mysuru"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="Karnataka"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="570001"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="text-xl font-semibold mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {cartItems.map(item => {
                const price = toNum(item.price);
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.variant.product.title}</p>
                      <p className="text-gray-600">{item.variant.size} × {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{(price * item.quantity).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST</span>
                <span className="font-semibold">₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-indigo-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}