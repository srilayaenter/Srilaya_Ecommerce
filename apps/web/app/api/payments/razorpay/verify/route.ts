import { prisma } from "../../../../../lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { sendEmail } from "../../../../../lib/email";
import { buildOrderConfirmationEmail } from "../../../../../lib/emails/orderConfirmation";
import { toNum } from "../../../../../lib/decimal";
import { earnPoints, processReferral } from "../../../../../lib/loyalty";
import { generateInvoicePdf } from "../../../../../lib/generateInvoicePdf";
import { log, logPaymentVerified, logPaymentFailed, logError } from "../../../../../lib/logger";

export async function POST(request: Request) {
  let dbOrderId: string | undefined;
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId: _dbOrderId,
    } = body;
    dbOrderId = _dbOrderId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
      logPaymentFailed({ reason: "missing_fields" });
      await log.flush();
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay secret not configured" },
        { status: 500 }
      );
    }

    const bodyString = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(bodyString)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      logPaymentFailed({ razorpayOrderId: razorpay_order_id, reason: "invalid_signature" });
      await log.flush();
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: dbOrderId } });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ensure this payment request matches the Razorpay order ID we stored —
    // prevents an attacker from submitting a valid signature for order A
    // but claiming it belongs to order B.
    if (order.paymentId !== razorpay_order_id) {
      return NextResponse.json({ error: "Payment mismatch" }, { status: 400 });
    }

    if (order.status !== 'paid') {
      const invoiceNo = order.invoiceNo || `INV-${Date.now()}`;

      logPaymentVerified({
        orderId: dbOrderId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        total: toNum(order.total),
        email: order.email ?? "",
      });

      const updatedOrder = await prisma.order.update({
        where: { id: dbOrderId },
        data: {
          status: "paid",
          paymentId: razorpay_payment_id,
          invoiceNo,
        },
        include: {
          items: {
            include: { variant: { include: { product: true } } },
          },
        },
      });

      // Send order confirmation email to the customer
      if (updatedOrder.email) {
        const html = buildOrderConfirmationEmail({
          customerName: updatedOrder.customerName || "Customer",
          orderId: updatedOrder.id,
          invoiceNo,
          items: updatedOrder.items.map((item) => ({
            title: item.variant.product.title,
            size: item.variant.size,
            quantity: item.quantity,
            price: toNum(item.price),
          })),
          subtotal: toNum(updatedOrder.subtotal),
          taxTotal: toNum(updatedOrder.taxTotal),
          shippingFee: toNum(updatedOrder.shippingFee),
          total: toNum(updatedOrder.total),
          address: updatedOrder.address || "",
          city: updatedOrder.city || "",
          state: updatedOrder.state || "",
          zipCode: updatedOrder.zipCode || "",
        });

        let pdfBuffer: Buffer | undefined;
        try {
          pdfBuffer = await generateInvoicePdf({
            invoiceNo,
            orderId: updatedOrder.id,
            createdAt: updatedOrder.createdAt,
            customerName: updatedOrder.customerName || "Customer",
            email: updatedOrder.email,
            phone: updatedOrder.phone,
            address: updatedOrder.address,
            city: updatedOrder.city,
            state: updatedOrder.state,
            zipCode: updatedOrder.zipCode,
            items: updatedOrder.items.map(i => ({
              title: i.variant.product.title,
              size: i.variant.size,
              quantity: i.quantity,
              price: toNum(i.price),
              gstRate: toNum(i.gstRate),
            })),
            subtotal: toNum(updatedOrder.subtotal),
            taxTotal: toNum(updatedOrder.taxTotal),
            shippingFee: toNum(updatedOrder.shippingFee),
            total: toNum(updatedOrder.total),
            paymentMethod: updatedOrder.paymentMethod,
            discountAmount: updatedOrder.discountAmount ? toNum(updatedOrder.discountAmount) : null,
          });
        } catch { /* PDF generation failure should not block email */ }

        await sendEmail({
          to: updatedOrder.email,
          subject: `Order Confirmed — ${invoiceNo} | SriLaYa Naturals`,
          html,
          context: `order:${dbOrderId}`,
          ...(pdfBuffer ? { attachments: [{ filename: `${invoiceNo}.pdf`, content: pdfBuffer }] } : {}),
        });
      }
    }

    // Earn loyalty points + process referral for online payment — fire and forget
    if (order.email && order.status !== 'paid') {
      earnPoints(order.email, dbOrderId, toNum(order.total)).catch(() => {});
      if (order.referralCode) {
        processReferral(order.email, order.referralCode, dbOrderId).catch(() => {});
      }
    }

    const cookieStore = await cookies();
    const cartId = cookieStore.get('cartId')?.value;
    if (cartId) {
      await prisma.cartItem.deleteMany({ where: { cartId } });
    }

    await log.flush();
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
    });

  } catch (error: any) {
    logError("payment.verify", error, { dbOrderId });
    await log.flush();
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}