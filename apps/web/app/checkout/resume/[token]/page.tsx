import { prisma } from "../../../../lib/db";
import { verifyResumeToken } from "../../../../lib/emails/orderExpired";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ResumeOrderPage({ params }: PageProps) {
  const { token } = await params;

  const orderId = verifyResumeToken(token);

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">This link isn't valid</h1>
        <p className="text-gray-600 mb-6">It may have expired or been altered.</p>
        <Link href="/">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Go to Homepage
          </button>
        </Link>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { variant: { include: { product: true } } }
      }
    }
  });

  if (!order) {
    notFound();
  }

  if (order.status !== 'expired') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Nothing to resume</h1>
        <p className="text-gray-600 mb-6">
          This order is no longer in an expired state ({order.status}).
        </p>
        <Link href="/">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Continue Shopping
          </button>
        </Link>
      </div>
    );
  }

  const availability = order.items.map(item => ({
    item,
    currentStock: item.variant.stock,
    canFulfill: item.variant.stock >= item.quantity,
  }));

  const fullyAvailable = availability.filter(a => a.canFulfill);
  const unavailable = availability.filter(a => !a.canFulfill);

  if (fullyAvailable.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sorry — these items sold out</h1>
        <p className="text-gray-600 mb-6">
          Every item from your previous order is now out of stock. We can't
          resume this one, but feel free to browse what's available.
        </p>
        <Link href="/category/millets">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Browse Products
          </button>
        </Link>
      </div>
    );
  }

  const cookieStore = await cookies();
  let cartId = cookieStore.get('cartId')?.value;

  if (!cartId) {
    const newCart = await prisma.cart.create({ data: { userId: null } });
    cartId = newCart.id;
    cookieStore.set('cartId', cartId, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      path: '/',
    });
  }

  for (const { item } of fullyAvailable) {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId, variantId: item.variantId }
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          gstRate: item.gstRate,
        }
      });
    }
  }

  if (unavailable.length > 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">We restored most of your order</h1>
        <p className="text-gray-600 mb-4">
          These items are back in your cart:
        </p>
        <ul className="text-left mb-4 text-sm">
          {fullyAvailable.map(({ item }) => (
            <li key={item.id}>✅ {item.variant.product.title} ({item.variant.size}) × {item.quantity}</li>
          ))}
        </ul>
        <p className="text-gray-600 mb-2">
          Unfortunately these sold out and couldn't be restored:
        </p>
        <ul className="text-left mb-6 text-sm text-red-600">
          {unavailable.map(({ item }) => (
            <li key={item.id}>❌ {item.variant.product.title} ({item.variant.size})</li>
          ))}
        </ul>
        <Link href="/cart">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
            Go to Cart
          </button>
        </Link>
      </div>
    );
  }

  redirect('/cart');
}