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
      <div className="container mx-auto px-4 py-16 text-center text-slate-800">
        <span className="text-4xl block mb-4">🛒</span>
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/product">
          <button className="bg-brand-green text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-sm">
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  const total = subtotal + taxTotal;

  return (
    <div className="container mx-auto px-4 py-8 text-slate-800">
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-slate-900">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-slate-900">Shipping Information</h2>

            <form action={createOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 focus:ring-2 focus:ring-emerald-50"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 focus:ring-2 focus:ring-emerald-50"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 focus:ring-2 focus:ring-emerald-50"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Address *</label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 focus:ring-2 focus:ring-emerald-50 resize-none"
                  placeholder="Street address, apartment, suite, etc."
                ></textarea>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 focus:ring-2 focus:ring-emerald-50"
                    placeholder="Mysuru"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">State *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 focus:ring-2 focus:ring-emerald-50"
                    placeholder="Karnataka"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 focus:ring-2 focus:ring-emerald-50"
                    placeholder="570001"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-brand-green text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-sm text-sm"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-4 border-b border-slate-50 pb-3 text-slate-900">Order Summary</h3>

            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto no-scrollbar">
              {cartItems.map(item => {
                const price = toNum(item.price);
                return (
                  <div key={item.id} className="flex justify-between items-start text-xs font-medium">
                    <div>
                      <p className="font-bold text-slate-800">{item.variant.product.title}</p>
                      <p className="text-slate-400 mt-0.5">{item.variant.size} × {item.quantity}</p>
                    </div>
                    <p className="font-bold text-slate-900">₹{(price * item.quantity).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST</span>
                <span className="font-bold text-slate-800">₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide">Free</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <div className="flex justify-between text-xl font-extrabold">
                <span className="text-slate-900">Total</span>
                <span className="text-brand-green">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}