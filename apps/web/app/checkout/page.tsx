import { cookies } from "next/headers";
import { prisma } from "../../lib/db";
import Link from "next/link";
import { toNum } from "../../lib/decimal";
import CheckoutForm from "@/components/CheckoutForm";
import { ShoppingCart } from "@phosphor-icons/react/dist/ssr";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      <div className="container mx-auto px-4 py-16 text-center text-[#212121]">
        <ShoppingCart size={40} weight="regular" className="text-[#9E9E9E] mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/product">
          <button className="bg-[#006A38] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#00522B] transition-all shadow-sm">
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

  // Pre-fill checkout fields from session + last order
  const session = await getServerSession(authOptions);
  let defaultEmail = "";
  let defaultPhone = "";
  let defaultName  = "";
  let defaultAddress = "";
  let defaultCity    = "";
  let defaultState   = "";
  let defaultZip     = "";
  let emailRequired  = true;

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true },
    });
    defaultEmail = dbUser?.email ?? "";
    defaultPhone = dbUser?.phone ?? "";
    if (!defaultEmail && defaultPhone) emailRequired = false;

    // Pre-fill shipping details from the most recent completed order
    const lastOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          ...(dbUser?.email ? [{ email: dbUser.email }] : []),
        ],
        customerName: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: {
        customerName: true,
        address:      true,
        city:         true,
        state:        true,
        zipCode:      true,
      },
    });

    if (lastOrder) {
      defaultName    = lastOrder.customerName ?? "";
      defaultAddress = lastOrder.address      ?? "";
      defaultCity    = lastOrder.city         ?? "";
      defaultState   = lastOrder.state        ?? "";
      defaultZip     = lastOrder.zipCode      ?? "";
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 text-[#212121]">
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-[#212121]">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 text-sm font-semibold">
          {error}
        </div>
      )}

      <CheckoutForm
        cartItems={serialisedItems}
        subtotal={subtotal}
        taxTotal={taxTotal}
        defaultEmail={defaultEmail}
        defaultPhone={defaultPhone}
        defaultName={defaultName}
        defaultAddress={defaultAddress}
        defaultCity={defaultCity}
        defaultState={defaultState}
        defaultZip={defaultZip}
        emailRequired={emailRequired}
      />
    </div>
  );
}
