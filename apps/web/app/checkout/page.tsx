import { cookies } from "next/headers";
import { prisma } from "../../lib/db";
import Link from "next/link";
import { toNum } from "../../lib/decimal";
import CheckoutForm from "@/components/CheckoutForm";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { error } = searchParams;

  const cookieStore = cookies();
  const cartId = cookieStore.get("cartId")?.value;

  let cartItems: any[] = [];
  let subtotal = 0;
  let taxTotal = 0;

  if (cartId) {
    cartItems = await prisma.cartItem.findMany({
      where: { cartId },
      include: {
        variant: { include: { product: true } },
      },
    });

    subtotal = cartItems.reduce((sum, item) => sum + toNum(item.price) * item.quantity, 0);
    taxTotal = cartItems.reduce((sum, item) => {
      return sum + (toNum(item.price) * item.quantity * toNum(item.gstRate)) / 100;
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

  // Serialise cart items for the client component (no Decimal or Date objects)
  const serialisedItems = cartItems.map((item) => ({
    id: item.id,
    title: item.variant.product.title,
    size: item.variant.size,
    quantity: item.quantity,
    price: toNum(item.price),
    weightGrams: item.variant.weightGrams ?? 500,
  }));

  return (
    <div className="container mx-auto px-4 py-8 text-slate-800">
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-slate-900">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 text-sm font-semibold">
          {error}
        </div>
      )}

      <CheckoutForm
        cartItems={serialisedItems}
        subtotal={subtotal}
        taxTotal={taxTotal}
      />
    </div>
  );
}
