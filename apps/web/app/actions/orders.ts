'use server';

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { toNum } from "@/lib/decimal";
import { sendEmail } from "@/lib/email";
import { buildLowStockAlert } from "@/lib/emails/adminAlerts";
import { buildOrderConfirmationEmail } from "@/lib/emails/orderConfirmation";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { sendWhatsApp, orderConfirmedMessage } from "@/lib/whatsapp";
import { earnPoints, redeemPoints, getBalance, pointsToRupees, MIN_REDEEM_POINTS, maxRedeemablePoints, processReferral } from "@/lib/loyalty";
import { calcCouponDiscount, calcOrderTotal, calcOrderSubtotals } from "@/lib/pricing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logStockChanges } from "@/lib/stockLog";
import { logOrderPlaced } from "@/lib/logger";
import { buildOrderAccessGrant } from "@/lib/orderAccess";
import { buildPayCapabilityToken } from "@/lib/payAuth";
import { resolveCourierLabel } from "@/lib/shipping";

export async function createOrder(formData: FormData): Promise<void> {
  const cookieStore = await cookies();
  const cartId = cookieStore.get('cartId')?.value;

  if (!cartId) redirect('/cart');

  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    include: { variant: { include: { product: true } } },
  });

  if (cartItems.length === 0) redirect('/cart');

  const { subtotal, taxTotal } = calcOrderSubtotals(
    cartItems.map((item) => ({
      price: toNum(item.price),
      quantity: item.quantity,
      gstRate: toNum(item.gstRate),
    }))
  );

  const customerName  = formData.get('name')        as string;
  const email         = ((formData.get('email') as string) || '').trim() || '';
  const phone         = ((formData.get('phone') as string) || '').trim();
  const address       = formData.get('address')     as string;
  const city          = formData.get('city')        as string;
  const state         = formData.get('state')       as string;
  const zipCode       = formData.get('zipCode')     as string;
  const courierName   = formData.get('courierName') as string;
  const shippingFee   = parseFloat(formData.get('shippingFee') as string) || 0;
  const paymentMethod  = formData.get('paymentMethod') as string | null;
  const redeemedPoints = parseInt(formData.get('redeemedPoints') as string || '0', 10) || 0;
  const referralCode   = (formData.get('referralCode') as string || '').trim().toUpperCase() || null;
  const couponCodeRaw  = (formData.get('couponCode') as string || '').trim().toUpperCase() || null;

  const session = await getServerSession(authOptions);
  let sessionUserId: string | undefined;
  if (session?.user?.id) {
    const userExists = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
    sessionUserId = userExists?.id;
  }

  const baseTotal = subtotal + taxTotal + shippingFee;

  // Validate redeemed points server-side
  let validatedPoints = 0;
  let loyaltyDiscount = 0;
  if (redeemedPoints >= MIN_REDEEM_POINTS && email) {
    const balance = await getBalance(email);
    const maxPoints = maxRedeemablePoints(baseTotal, balance);
    validatedPoints = Math.min(redeemedPoints, maxPoints);
    loyaltyDiscount = pointsToRupees(validatedPoints);
  }

  // Validate coupon server-side
  let couponDiscount = 0;
  let validatedCouponCode: string | null = null;
  if (couponCodeRaw) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCodeRaw } });
    const now = new Date();
    const isValid =
      coupon &&
      coupon.active &&
      (!coupon.expiresAt || coupon.expiresAt > now) &&
      (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
      (!coupon.minOrder || baseTotal >= Number(coupon.minOrder));

    if (isValid && coupon) {
      couponDiscount = calcCouponDiscount(baseTotal, coupon);
      validatedCouponCode = coupon.code;
    }
  }

  const total = calcOrderTotal(baseTotal, loyaltyDiscount, couponDiscount);

  let orderId: string;

  try {
    orderId = await prisma.$transaction(async (tx) => {
      // Reserve stock
      for (const item of cartItems) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data:  { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          throw new Error(
            `INSUFFICIENT_STOCK:${item.variant.product.title} (${item.variant.size})`
          );
        }
      }

      const isCod = paymentMethod === 'cod';
      const order = await tx.order.create({
        data: {
          customerName,
          email:  email  || undefined,
          phone:  phone  || undefined,
          address,
          city,
          state,
          zipCode,
          subtotal,
          taxTotal,
          shippingFee,
          total,
          currency: 'INR',
          status: isCod ? 'cod_pending' : 'pending',
          orderChannel: 'online',
          paymentMethod: paymentMethod || undefined,
          cartId,
          // courierName currently holds the submitted CourierKey (e.g.
          // "delhivery"), not a display name — see CheckoutForm.tsx's hidden
          // "courierName" field. Snapshot both the key and its resolved
          // label at order-creation time so historical orders stay accurate
          // even if shipping.ts's COURIERS list changes later.
          courierKey: courierName || undefined,
          courierLabel: resolveCourierLabel(courierName) || undefined,
          discountAmount: (loyaltyDiscount + couponDiscount) > 0 ? loyaltyDiscount + couponDiscount : undefined,
          couponCode: validatedCouponCode || undefined,
          referralCode: referralCode || undefined,
          userId: sessionUserId,
        },
      });

      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId:   order.id,
            variantId: item.variantId,
            quantity:  item.quantity,
            price:     item.price,
            gstRate:   item.gstRate,
          },
        });
      }

      return order.id;
    }, { timeout: 15000 });
  } catch (err: any) {
    if (typeof err.message === 'string' && err.message.startsWith('INSUFFICIENT_STOCK:')) {
      const info = err.message.replace('INSUFFICIENT_STOCK:', '');
      redirect(`/checkout?error=${encodeURIComponent(`Not enough stock for ${info}`)}`);
    }

    // This cart already has a live (pending/cod_pending) order — the
    // Order_cartId_live_unique partial index (packages/db/migrations/
    // 20260819194746_add_order_cartid_live_unique) rejected our insert.
    // Rather than fail the request, send the customer to the order that
    // already exists for this cart instead of creating a duplicate. This is
    // the expected, common outcome of a retry (double-click, refresh, a
    // second tab, or resubmitting after an abandoned/failed payment while
    // the original order is still live) — not an error condition. See
    // docs/proposal-2-final-release-ready-plan-2026-08-20.md.
    //
    // Prisma reports this as P2002 with meta.target = ["cartId"] (the
    // underlying column name), NOT the raw-SQL index name — confirmed via
    // tests/unit/orderCreationIdempotencyRace.integration.test.ts against a
    // real database, since this index isn't declared in schema.prisma for
    // Prisma to know its name by. "cartId" has no other unique constraint
    // anywhere in this schema, so matching on it here is unambiguous.
    const isLiveOrderConflict =
      err?.code === 'P2002' &&
      (Array.isArray(err?.meta?.target)
        ? err.meta.target.includes('cartId')
        : String(err?.meta?.target ?? '').includes('cartId'));

    if (isLiveOrderConflict) {
      const existing = await prisma.order.findFirst({
        where: { cartId, status: { in: ['pending', 'cod_pending'] } },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        if (existing.status === 'cod_pending') {
          redirect(`/checkout/confirm/${existing.id}`);
        }
        if (!sessionUserId) {
          const payToken = buildPayCapabilityToken(existing.id);
          redirect(`/checkout/pay/${existing.id}?pay_token=${payToken}`);
        }
        redirect(`/checkout/pay/${existing.id}`);
      }
    }

    throw err;
  }

  // COD is a firm commitment at creation — no external payment step follows,
  // so its cart is cleared immediately, same as always. Online orders are
  // NOT cleared here: clearing happens only once Razorpay confirms payment
  // (verify or webhook, keyed off order.cartId set above), so an abandoned
  // or failed payment leaves the cart intact for the customer to retry. See
  // docs/proposal-1a-order-cart-linkage-2026-08-19.md.
  if (paymentMethod === 'cod') {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  }

  logOrderPlaced({
    orderId,
    invoiceNo: "",
    customerName,
    email: email || "",
    total,
    paymentMethod: paymentMethod || "online",
    itemCount: cartItems.length,
    city,
    state,
  });

  // Log stock deductions
  logStockChanges(cartItems.map(item => ({
    variantId: item.variantId,
    sku:       item.variant.sku,
    delta:     -item.quantity,
    reason:    "order" as const,
    note:      orderId,
  }))).catch(() => {});

  const isCodOrder = paymentMethod === 'cod';

  // COD orders have no external payment-verification step — the transaction
  // committing above (order created, stock reserved) is the equivalent
  // "confirmed" moment that Razorpay's /verify route reaches via signature
  // validation. Mint the same order-scoped guest access grant here so a
  // guest can view their own COD confirmation page without logging in.
  // For logged-in orders this cookie is set too, but is never consulted —
  // see canAccessOrder() in lib/orderAccess.ts.
  //
  // Path override (call-site only — orderAccess.ts itself is unmodified):
  // buildOrderAccessGrant()'s default path is "/orders/{orderId}", scoped
  // for the Razorpay-verify mint site where only /orders/[id] and its
  // /invoice sub-route need the cookie. A COD guest also needs it at
  // /checkout/confirm/{orderId} — a sibling path with no common prefix
  // with /orders other than "/". Browsers match cookie Path as a strict
  // prefix (no OR-of-prefixes), so one cookie can't be scoped to two
  // unrelated prefixes — "/" is the narrowest path that covers both
  // routes this grant must work on. Security still rests entirely on the
  // HMAC (order-ID + purpose + expiry bound, constant-time compared) and
  // httpOnly/secure/sameSite, not on Path, so broadening Path here does
  // not weaken the grant — it only changes which same-origin requests
  // carry it, and the value remains useless for any other order.
  if (isCodOrder) {
    const grant = buildOrderAccessGrant(orderId);
    (await cookies()).set(grant.name, grant.value, { ...grant.options, path: "/" });
  }

  // Increment coupon usage counter
  if (validatedCouponCode) {
    void prisma.coupon.update({
      where: { code: validatedCouponCode },
      data:  { usedCount: { increment: 1 } },
    }).catch(() => {});
  }

  // Loyalty points — redeem then earn (fire and forget)
  if (email) {
    Promise.resolve().then(async () => {
      if (validatedPoints > 0) await redeemPoints(email, orderId, validatedPoints).catch(() => {});
      if (isCodOrder) {
        await earnPoints(email, orderId, total).catch(() => {});
        if (referralCode) await processReferral(email, referralCode, orderId).catch(() => {});
      }
    });
  }

  // COD order confirmation email with PDF — fire and forget
  if (isCodOrder && email) {
    const shortId   = orderId.slice(0, 8).toUpperCase();
    const invoiceNo = `SL-${shortId}`;
    Promise.resolve().then(async () => {
      try {
        const orderWithItems = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: { include: { variant: { include: { product: true } } } } },
        });
        if (!orderWithItems) return;
        const html = buildOrderConfirmationEmail({
          customerName,
          orderId,
          invoiceNo,
          items: orderWithItems.items.map(i => ({
            title: i.variant.product.title,
            size: i.variant.size,
            quantity: i.quantity,
            price: toNum(i.price),
          })),
          subtotal: toNum(orderWithItems.subtotal),
          taxTotal: toNum(orderWithItems.taxTotal),
          shippingFee: toNum(orderWithItems.shippingFee),
          total: toNum(orderWithItems.total),
          address: orderWithItems.address || "",
          city: orderWithItems.city || "",
          state: orderWithItems.state || "",
          zipCode: orderWithItems.zipCode || "",
          isCod: true,
        });
        let pdfBuffer: Buffer | undefined;
        try {
          pdfBuffer = await generateInvoicePdf({
            invoiceNo,
            orderId,
            createdAt: orderWithItems.createdAt,
            customerName,
            email,
            phone: orderWithItems.phone,
            address: orderWithItems.address,
            city: orderWithItems.city,
            state: orderWithItems.state,
            zipCode: orderWithItems.zipCode,
            items: orderWithItems.items.map(i => ({
              title: i.variant.product.title,
              size: i.variant.size,
              quantity: i.quantity,
              price: toNum(i.price),
              gstRate: toNum(i.gstRate),
            })),
            subtotal: toNum(orderWithItems.subtotal),
            taxTotal: toNum(orderWithItems.taxTotal),
            shippingFee: toNum(orderWithItems.shippingFee),
            total: toNum(orderWithItems.total),
            paymentMethod: 'cod',
            discountAmount: orderWithItems.discountAmount ? toNum(orderWithItems.discountAmount) : null,
          });
        } catch { /* PDF failure should not block email */ }
        await sendEmail({
          to: email,
          subject: `Order Confirmed — ${invoiceNo} | SriLaYa Naturals`,
          html,
          context: `order:${orderId}`,
          ...(pdfBuffer ? { attachments: [{ filename: `${invoiceNo}.pdf`, content: pdfBuffer }] } : {}),
        });
      } catch { /* ignore */ }
    });
  }

  // WhatsApp confirmation — fire and forget
  if (phone) {
    sendWhatsApp(phone, orderConfirmedMessage({
      customerName,
      shortId: orderId.slice(0, 8).toUpperCase(),
      total: subtotal + taxTotal + (parseFloat(formData.get('shippingFee') as string) || 0),
      paymentMethod: paymentMethod ?? 'online',
    })).catch(() => {});
  }

  // Real-time low stock alert — fire and forget, don't block checkout
  if (process.env.ADMIN_ALERT_EMAIL) {
    prisma.productVariant.findMany({
      where: {
        id: { in: cartItems.map(i => i.variantId) },
      },
      include: { product: true },
    }).then(variants => {
      const low = variants.filter(v => v.stock <= v.reorderThreshold);
      if (low.length > 0) {
        sendEmail({
          to: process.env.ADMIN_ALERT_EMAIL!,
          subject: `Low stock alert — ${low.length} item(s) after order ${orderId.slice(0, 8).toUpperCase()}`,
          html: buildLowStockAlert({
            variants: low.map(v => ({
              productTitle: v.product.title,
              size: v.size,
              stock: v.stock,
              sku: v.sku,
            })),
          }),
          context: 'admin_alert_low_stock',
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  if (isCodOrder) {
    redirect(`/checkout/confirm/${orderId}`);
  }

  // Guest online orders need a pre-payment capability to reach their own
  // pay page (see lib/payAuth.ts) — logged-in orders don't, since ownership
  // is already provable via session on that page. Never mint one for COD
  // (handled above) or if order creation didn't actually succeed (this line
  // is unreachable unless orderId was assigned from a committed transaction).
  if (!sessionUserId) {
    const payToken = buildPayCapabilityToken(orderId);
    redirect(`/checkout/pay/${orderId}?pay_token=${payToken}`);
  }
  redirect(`/checkout/pay/${orderId}`);
}
