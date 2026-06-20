import { cookies } from "next/headers";
import { prisma } from "../../lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
          <Link href="/category/millets">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const price = parseFloat(item.price.toString());
              const itemTotal = price * item.quantity;

              return (
                <div key={item.id} className="bg-white rounded-lg shadow p-6 flex gap-4">
                  {item.variant.product.image && (
                    <img
                      src={item.variant.product.image}
                      alt={item.variant.product.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}

                  <div className="flex-1">
                    <Link href={`/product/${item.variant.product.slug}`}>
                      <h3 className="font-semibold text-lg hover:text-indigo-600">
                        {item.variant.product.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600">Size: {item.variant.size}</p>
                    <p className="text-indigo-600 font-semibold mt-2">
                      ₹{price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <form action={deleteCartItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </form>

                    <div className="flex items-center gap-2">
                      <form action={updateQuantity}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="quantity" value={item.quantity - 1} />
                        <button
                          type="submit"
                          className="px-2 py-1 border rounded hover:bg-gray-100"
                        >
                          -
                        </button>
                      </form>

                      <span className="w-12 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <form action={updateQuantity}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="quantity" value={item.quantity + 1} />
                        <button
                          type="submit"
                          className="px-2 py-1 border rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                      </form>
                    </div>

                    <p className="font-bold text-lg">
                      ₹{itemTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
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

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-indigo-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
                  Proceed to Checkout
                </button>
              </Link>

              <Link href="/category/millets">
                <button className="w-full mt-3 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50">
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