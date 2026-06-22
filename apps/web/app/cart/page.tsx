import { cookies } from "next/headers";
import { prisma } from "../../lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";

async function deleteCartItem(formData: FormData) {
  'use server';
  const itemId = formData.get('itemId') as string;
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  // Ownership check: only delete if this item actually belongs to the
  // cart in the requesting cookie, not just any item id passed in.
  await prisma.cartItem.deleteMany({
    where: { id: itemId, cartId: cartId }
  });
  redirect('/cart');
}

async function updateQuantity(formData: FormData) {
  'use server';
  const itemId = formData.get('itemId') as string;
  const newQuantity = parseInt(formData.get('quantity') as string);
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  if (newQuantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cartId }
    });
  } else {
    await prisma.cartItem.updateMany({
      where: { id: itemId, cartId: cartId },
      data: { quantity: newQuantity }
    });
  }
  redirect('/cart');
}

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  let cartItems: any[] = [];
  let subtotal = 0;
  let taxTotal = 0;

  if (cartId) {
    cartItems = await prisma.cartItem.findMany({
      where: { cartId: cartId },
      include: {
        variant: {
          include: { product: true }
        }
      }
    });

    subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price.toString());
      return sum + (price * item.quantity);
    }, 0);

    taxTotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price.toString());
      const gstRate = parseFloat(item.gstRate.toString());
      return sum + (price * item.quantity * gstRate / 100);
    }, 0);
  }

  const total = subtotal + taxTotal;

  return (
    <div className="container mx-auto px-4 py-8 text-slate-800">
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-slate-900">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center max-w-lg mx-auto">
          <span className="text-4xl block mb-4">🛒</span>
          <p className="text-slate-500 font-medium text-lg mb-6">Your cart is empty</p>
          <Link href="/product">
            <button className="bg-brand-green text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-sm block w-full text-center">
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* Cart Items List */}
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const price = parseFloat(item.price.toString());
              const itemTotal = price * item.quantity;

              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex gap-4">
                  {item.variant.product.image && (
                    <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2 flex-shrink-0 border border-slate-100">
                      <img
                        src={item.variant.product.image}
                        alt={item.variant.product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <Link href={`/product/${item.variant.product.slug}`}>
                      <h3 className="font-bold text-lg text-slate-800 hover:text-brand-green transition-colors line-clamp-1">
                        {item.variant.product.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md inline-block">
                      Size: {item.variant.size}
                    </p>
                    <p className="text-brand-green font-extrabold mt-3 text-base">
                      ₹{price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <form action={deleteCartItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        className="text-red-500 hover:text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </form>

                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <form action={updateQuantity}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="quantity" value={item.quantity - 1} />
                        <button
                          type="submit"
                          className="w-8 h-8 flex items-center justify-center font-bold bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          -
                        </button>
                      </form>

                      <span className="w-8 text-center text-sm font-bold text-slate-800">
                        {item.quantity}
                      </span>

                      <form action={updateQuantity}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="quantity" value={item.quantity + 1} />
                        <button
                          type="submit"
                          className="w-8 h-8 flex items-center justify-center font-bold bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          +
                        </button>
                      </form>
                    </div>

                    <p className="font-extrabold text-slate-900 text-lg">
                      ₹{itemTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Sticky Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-4 border-b border-slate-50 pb-3 text-slate-900">Order Summary</h3>

            <div className="space-y-3 mb-4 text-sm font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST</span>
                <span className="font-bold text-slate-800">₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs uppercase tracking-wide">
                  Free
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mb-6">
              <div className="flex justify-between text-xl font-extrabold">
                <span className="text-slate-900">Total</span>
                <span className="text-brand-green">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons: Explicitly visible on load */}
            <div className="space-y-3">
              <Link href="/checkout" className="block w-full">
                <button className="w-full bg-brand-green text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-sm block text-center text-sm">
                  Proceed to Checkout
                </button>
              </Link>

              <Link href="/product" className="block w-full">
                <button className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all block text-center text-sm">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}