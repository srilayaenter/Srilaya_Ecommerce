import { cookies } from "next/headers";
import { prisma } from "../../lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";
import CouponInput from "@/components/CouponInput";

async function deleteCartItem(formData: FormData) {
  'use server';
  const itemId = formData.get('itemId') as string;
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;
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
    await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cartId } });
  } else {
    await prisma.cartItem.updateMany({ where: { id: itemId, cartId: cartId }, data: { quantity: newQuantity } });
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
      where: { cartId },
      include: { variant: { include: { product: true } } },
    });

    subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price.toString()) * item.quantity, 0);
    taxTotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price.toString());
      const gst   = parseFloat(item.gstRate.toString());
      return sum + price * item.quantity * gst / 100;
    }, 0);
  }

  const total = subtotal + taxTotal;

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-black mb-8 tracking-tight text-[#212121]">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-12 text-center max-w-lg mx-auto">
            <span className="text-4xl block mb-4">🛒</span>
            <p className="text-[#757575] font-medium text-lg mb-6">Your cart is empty</p>
            <Link href="/product" className="block w-full bg-[#006A38] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#00522B] transition-all shadow-sm text-center">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 items-start">

            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const price     = parseFloat(item.price.toString());
                const itemTotal = price * item.quantity;

                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6 flex gap-4">
                    {item.variant.product.image && (
                      <div className="w-24 h-24 bg-[#F5F5F5] rounded-xl overflow-hidden flex items-center justify-center p-2 flex-shrink-0 border border-[#E0E0E0]">
                        <img
                          src={item.variant.product.image}
                          alt={item.variant.product.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <Link href={`/product/${item.variant.product.slug}`}>
                        <h3 className="font-bold text-lg text-[#212121] hover:text-[#006A38] transition-colors line-clamp-1">
                          {item.variant.product.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-[#757575] mt-1 font-medium bg-[#F5F5F5] px-2 py-0.5 rounded-md inline-block">
                        Size: {item.variant.size}
                      </p>
                      <p className="text-[#006A38] font-extrabold mt-3 text-base">
                        ₹{price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <form action={deleteCartItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button type="submit" className="text-red-500 hover:text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-lg transition-colors">
                          Remove
                        </button>
                      </form>

                      <div className="flex items-center gap-2 bg-[#F5F5F5] p-1 rounded-xl border border-[#E0E0E0]">
                        <form action={updateQuantity}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="quantity" value={item.quantity - 1} />
                          <button type="submit" className="w-8 h-8 flex items-center justify-center font-bold bg-white text-[#424242] rounded-lg border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors">
                            −
                          </button>
                        </form>
                        <span className="w-8 text-center text-sm font-bold text-[#212121]">
                          {item.quantity}
                        </span>
                        <form action={updateQuantity}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="quantity" value={item.quantity + 1} />
                          <button type="submit" className="w-8 h-8 flex items-center justify-center font-bold bg-white text-[#424242] rounded-lg border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors">
                            +
                          </button>
                        </form>
                      </div>

                      <p className="font-extrabold text-[#212121] text-lg">
                        ₹{itemTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4 border-b border-[#F0F0F0] pb-3 text-[#212121]">Order Summary</h3>

              <div className="space-y-3 mb-4 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Subtotal</span>
                  <span className="font-bold text-[#212121]">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">GST</span>
                  <span className="font-bold text-[#212121]">₹{taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Shipping</span>
                  <span className="text-xs text-[#9E9E9E] italic font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">Coupon Code</p>
                <CouponInput orderTotal={total} />
              </div>

              <div className="border-t border-[#E0E0E0] pt-4 mb-6">
                <div className="flex justify-between text-xl font-extrabold">
                  <span className="text-[#212121]">Subtotal + GST</span>
                  <span className="text-[#006A38]">₹{total.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-[#9E9E9E] mt-1 text-right">
                  + shipping &amp; coupon discount applied at checkout
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/checkout" className="block w-full bg-[#006A38] text-white py-3 rounded-xl font-bold hover:bg-[#00522B] transition-all shadow-sm text-center text-sm">
                  Proceed to Checkout
                </Link>
                <Link href="/product" className="block w-full bg-[#F5F5F5] border border-[#E0E0E0] text-[#424242] py-3 rounded-xl font-bold hover:bg-[#EEEEEE] transition-all text-center text-sm">
                  Continue Shopping
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
